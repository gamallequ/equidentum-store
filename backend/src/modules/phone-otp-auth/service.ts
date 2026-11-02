import crypto from 'crypto'
import { AbstractAuthModuleProvider, MedusaError } from '@medusajs/framework/utils'
import type {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityDTO,
  AuthIdentityProviderService,
  Logger,
} from '@medusajs/framework/types'

import { PHONE_OTP_HASH_SECRET } from '../../lib/constants'
import { sendTextMessage } from '../../lib/messaging/outbound'
import { maskPhone, normalizePhone } from '../../lib/phone'

/**
 * Same limits as PhoneOtp in the stable-management API's appsettings.json.
 */
const CODE_LENGTH = 6
const VALIDITY_SECONDS = 300
const RESEND_COOLDOWN_SECONDS = 60
const MAX_VERIFY_ATTEMPTS = 5
const MAX_SENDS_PER_DAY = 10

/**
 * What is kept on the provider identity between "send me a code" and "here
 * is the code". It lives in the database, so cooldowns and daily limits
 * survive a restart. Only a keyed hash of the code is stored, never the code.
 */
type OtpState = {
  code_hash?: string
  expires_at?: number
  resend_at?: number
  attempts?: number
  sends_today?: number
  counter_day?: string
  consumed?: boolean
}

type InjectedDependencies = { logger: Logger }

/**
 * Customer sign-in with a phone number and a one-time code. There is no
 * password, and signing in and signing up are the same flow.
 *
 *   POST /auth/customer/phone-otp           { phone }       -> { location: "otp" }
 *   POST /auth/customer/phone-otp/callback  { phone, otp }  -> { token }
 *
 * The auth identity's entity_id is the phone number in E.164 form. If the
 * returned token has no actor_id, the phone has no customer yet. The
 * storefront then links an existing customer (/store/phone-auth/link) or
 * creates one, and refreshes the token.
 *
 * Port of PhoneOtpService.cs from the stable-management API.
 */
class PhoneOtpAuthService extends AbstractAuthModuleProvider {
  static identifier = 'phone-otp'
  static DISPLAY_NAME = 'Phone one-time code'

  protected logger_: Logger

  constructor({ logger }: InjectedDependencies, options: Record<string, unknown>) {
    // @ts-ignore - the base class takes the same arguments
    super(...arguments)
    this.logger_ = logger
  }

  /** Step 1: send a code. Creates the auth identity on a number's first use. */
  async authenticate(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const phone = normalizePhone(data.body?.phone)
    if (!phone) {
      return { success: false, error: 'Enter a valid mobile number.' }
    }

    let state: OtpState = {}
    let exists = true
    try {
      state = this.getState_(await authIdentityService.retrieve({ entity_id: phone }))
    } catch (error: any) {
      if (error?.type !== MedusaError.Types.NOT_FOUND) {
        return { success: false, error: error?.message ?? String(error) }
      }
      exists = false
    }

    const now = Date.now()
    const today = new Date(now).toISOString().slice(0, 10)
    const sendsToday = state.counter_day === today ? state.sends_today ?? 0 : 0

    if (sendsToday >= MAX_SENDS_PER_DAY) {
      return { success: false, error: 'Too many codes requested today. Please try again tomorrow.' }
    }

    if (state.resend_at && state.resend_at > now) {
      const seconds = Math.max(1, Math.ceil((state.resend_at - now) / 1000))
      return { success: false, error: `Please wait ${seconds} seconds before requesting another code.` }
    }

    const code = crypto.randomInt(10 ** (CODE_LENGTH - 1), 10 ** CODE_LENGTH).toString()
    const storeName = process.env.STORE_NAME || 'Equidentum'
    const minutes = Math.round(VALIDITY_SECONDS / 60)

    const sent = await sendTextMessage(phone, {
      sms: `${storeName}: your verification code is ${code}. Valid for ${minutes} minute(s).`,
      whatsapp: `*${storeName}*\n\nYour verification code is *${code}*.\nIt expires in ${minutes} minute(s).\n\nPlease don't share this code with anyone.`,
    })

    if (!sent.success) {
      this.logger_.warn(`Phone OTP delivery failed for ${maskPhone(phone)}: ${sent.error}`)
      return { success: false, error: 'We could not send a code right now. Please try again shortly.' }
    }

    // Stored only after a successful send, so a failed send does not use up
    // the cooldown.
    const next: OtpState = {
      code_hash: this.hash_(phone, code),
      expires_at: now + VALIDITY_SECONDS * 1000,
      resend_at: now + RESEND_COOLDOWN_SECONDS * 1000,
      attempts: 0,
      sends_today: sendsToday + 1,
      counter_day: today,
      consumed: false,
    }

    try {
      if (exists) {
        await authIdentityService.update(phone, { provider_metadata: next })
      } else {
        await authIdentityService.create({ entity_id: phone, provider_metadata: next })
      }
    } catch (error: any) {
      return { success: false, error: error?.message ?? String(error) }
    }

    this.logger_.info(`Phone OTP sent to ${maskPhone(phone)} via ${sent.channel}`)

    // A location tells the client that a second step follows. The route
    // returns it without issuing a token.
    return { success: true, location: 'otp' }
  }

  /** Sign-up is the same step as sign-in. */
  async register(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    return this.authenticate(data, authIdentityService)
  }

  /** Step 2: check the code. On success the route issues a token. */
  async validateCallback(
    data: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const input = { ...(data.query ?? {}), ...(data.body ?? {}) }
    const phone = normalizePhone(input.phone)
    const otp = typeof input.otp === 'string' ? input.otp.trim() : ''

    if (!phone) {
      return { success: false, error: 'Enter a valid mobile number.' }
    }
    if (!/^\d{4,8}$/.test(otp)) {
      return { success: false, error: 'Enter the code we sent you.' }
    }

    let authIdentity: AuthIdentityDTO
    try {
      authIdentity = await authIdentityService.retrieve({ entity_id: phone })
    } catch {
      return { success: false, error: 'No code was requested for this number. Request a new one.' }
    }

    const state = this.getState_(authIdentity)

    if (!state.code_hash || state.consumed) {
      return { success: false, error: 'No code was requested for this number. Request a new one.' }
    }
    if (!state.expires_at || state.expires_at < Date.now()) {
      return { success: false, error: 'This code has expired. Request a new one.' }
    }
    if ((state.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
      return { success: false, error: 'Too many wrong attempts. Request a new code.' }
    }

    const attempts = (state.attempts ?? 0) + 1
    const valid = this.equal_(state.code_hash, this.hash_(phone, otp))

    const updated = await authIdentityService.update(phone, {
      provider_metadata: { ...state, attempts, ...(valid ? { consumed: true } : {}) },
    })

    if (!valid) {
      return {
        success: false,
        error:
          attempts >= MAX_VERIFY_ATTEMPTS
            ? 'Too many wrong attempts. Request a new code.'
            : 'That code is not right. Please check it and try again.',
      }
    }

    return { success: true, authIdentity: this.sanitize_(updated) }
  }

  private getState_(authIdentity: AuthIdentityDTO): OtpState {
    const identity = authIdentity.provider_identities?.find((pi) => pi.provider === this.provider)
    return { ...((identity?.provider_metadata as OtpState | undefined) ?? {}) }
  }

  /** Strips the OTP state, so it never travels further than this provider. */
  private sanitize_(authIdentity: AuthIdentityDTO): AuthIdentityDTO {
    const copy = JSON.parse(JSON.stringify(authIdentity)) as AuthIdentityDTO
    copy.provider_identities?.forEach((pi) => {
      if (pi.provider === this.provider) pi.provider_metadata = {}
    })
    return copy
  }

  private hash_(phone: string, code: string): string {
    return crypto.createHmac('sha256', PHONE_OTP_HASH_SECRET).update(`${phone}:${code}`).digest('hex')
  }

  private equal_(a: string, b: string): boolean {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && crypto.timingSafeEqual(left, right)
  }
}

export default PhoneOtpAuthService

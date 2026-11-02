import type { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import type { IAuthModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'

import { PHONE_DEFAULT_COUNTRY_CODE } from '../../../../lib/constants'
import { normalizePhone } from '../../../../lib/phone'

/**
 * The ways an older account may have stored a number before phone sign-in
 * normalized it. For +966501234567 that is also 966501234567, 00966501234567,
 * 0501234567 and 501234567. Listing them lets the database do the matching
 * instead of loading every customer.
 */
function storedPhoneVariants(e164: string): string[] {
  const digits = e164.slice(1)
  const variants = new Set([e164, digits, `00${digits}`])

  if (digits.startsWith(PHONE_DEFAULT_COUNTRY_CODE)) {
    const national = digits.slice(PHONE_DEFAULT_COUNTRY_CODE.length)
    variants.add(national)
    variants.add(`0${national}`)
  }

  return [...variants]
}

/**
 * POST /store/phone-auth/link
 *
 * Runs after a phone code is verified and the token has no customer on it.
 * If a customer who registered before phone sign-in has this number, the
 * phone identity is attached to that customer. They keep their orders and
 * addresses and are not asked to sign up again.
 *
 * The phone is read from the verified auth identity, never from the request.
 * Otherwise anyone with a token could claim another customer by naming their
 * number.
 *
 * Responds { linked: true } after attaching a customer; the caller must
 * refresh its token to get one with the customer id. Responds
 * { linked: false, phone } when no single registered customer has the
 * number, and the storefront then asks for name and email instead. `phone` is
 * the normalized number, to be saved on the customer it creates. When two or more
 * accounts share the number, none is chosen.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { auth_identity_id, actor_id } = req.auth_context

  if (actor_id) {
    return res.json({ linked: true })
  }

  const authModule: IAuthModuleService = req.scope.resolve(Modules.AUTH)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const authIdentity = await authModule.retrieveAuthIdentity(auth_identity_id, {
    relations: ['provider_identities'],
  })

  const phoneIdentity = authIdentity.provider_identities?.find((pi) => pi.provider === 'phone-otp')
  const phone = normalizePhone(phoneIdentity?.entity_id)

  if (!phone) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'Only a phone sign-in can be linked to an existing account.'
    )
  }

  if (authIdentity.app_metadata?.customer_id) {
    return res.json({ linked: true })
  }

  // Through Query rather than the customer module, whose typed filters do
  // not include phone.
  const { data: candidates } = await query.graph({
    entity: 'customer',
    fields: ['id'],
    filters: { has_account: true, phone: storedPhoneVariants(phone) },
    pagination: { take: 2 },
  })

  if (candidates.length !== 1) {
    // The normalized number goes back so the storefront saves the new
    // customer's phone in the same form the sign-in uses.
    return res.json({ linked: false, phone })
  }

  await authModule.updateAuthIdentities({
    id: authIdentity.id,
    app_metadata: { ...(authIdentity.app_metadata ?? {}), customer_id: candidates[0].id },
  })

  return res.json({ linked: true })
}

import {
  FGC_SMS_API_BASE_URL,
  FGC_SMS_MESSAGE_TYPE_ID,
  FGC_SMS_PASSWORD,
  FGC_SMS_SENDER_NAME,
  FGC_SMS_USERNAME,
} from '../constants'
import { fetchWithTimeout, SendResult } from './types'

/**
 * FGC (First Gulf Company) SMS, per "FGC - DBS - Centralized Notification
 * Center - SMS Bulk API v1.1". Port of FgcSmsService.cs.
 *
 * Sending takes two requests:
 *   1. POST /authenticate { username, password } -> { token }. The token is
 *      valid for one minute, so a new one is fetched for every message.
 *   2. POST /sendSmsNotifications, with the raw token (no "Bearer") in the
 *      Authorization header and a body keyed data1, data2, ...
 * The send succeeded when the first key of the response is "E001". Any other
 * E0xx key is an error code.
 */
export const isFgcSmsConfigured = () => Boolean(FGC_SMS_USERNAME && FGC_SMS_PASSWORD)

const baseUrl = () => FGC_SMS_API_BASE_URL.replace(/\/+$/, '')

async function authenticate(): Promise<string | null> {
  const res = await fetchWithTimeout(`${baseUrl()}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: FGC_SMS_USERNAME, password: FGC_SMS_PASSWORD }),
  })

  if (!res.ok) return null
  const body = (await res.json().catch(() => null)) as { token?: string } | null
  return body?.token || null
}

/** `phone` is E.164. FGC wants the number without the leading '+'. */
export async function sendFgcSms(phone: string, text: string): Promise<SendResult> {
  if (!isFgcSmsConfigured()) {
    return { success: false, channel: 'sms', error: 'FGC SMS is not configured' }
  }

  try {
    const token = await authenticate()
    if (!token) {
      return { success: false, channel: 'sms', error: 'FGC authentication failed' }
    }

    const res = await fetchWithTimeout(`${baseUrl()}/sendSmsNotifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({
        data1: {
          msisdn: phone.replace(/^\+/, ''),
          text,
          header: FGC_SMS_SENDER_NAME,
          messageTypeId: FGC_SMS_MESSAGE_TYPE_ID,
        },
      }),
    })

    const raw = await res.text()
    let code: string | undefined
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') code = Object.keys(parsed)[0]
    } catch {
      // Not JSON: treated as a failure below.
    }

    if (code?.toUpperCase() === 'E001') return { success: true, channel: 'sms' }

    return {
      success: false,
      channel: 'sms',
      error: `FGC send failed (HTTP ${res.status}${code ? `, ${code}` : ''}): ${raw.slice(0, 300)}`,
    }
  } catch (error: any) {
    return { success: false, channel: 'sms', error: `FGC request failed: ${error?.message ?? error}` }
  }
}

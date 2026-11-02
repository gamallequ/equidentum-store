import { CARTAT_ACCESS_TOKEN, CARTAT_API_BASE_URL } from '../constants'
import { fetchWithTimeout, SendResult } from './types'

/**
 * Cartat WhatsApp. Port of CartatWhatsAppMessagingService.cs.
 *
 * POST {base}/message/text with a Bearer token and { number, message }. The
 * send succeeded when the response's `status` is "success".
 */
const accessToken = () => (CARTAT_ACCESS_TOKEN ?? '').trim().replace(/^Bearer\s+/i, '')

export const isCartatConfigured = () => Boolean(accessToken())

/** `phone` is E.164. Cartat wants digits only. */
export async function sendCartatWhatsApp(phone: string, message: string): Promise<SendResult> {
  if (!isCartatConfigured()) {
    return { success: false, channel: 'whatsapp', error: 'Cartat WhatsApp is not configured' }
  }

  try {
    const res = await fetchWithTimeout(`${CARTAT_API_BASE_URL.replace(/\/+$/, '')}/message/text`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken()}`,
      },
      body: JSON.stringify({ number: phone.replace(/\D/g, ''), message }),
    })

    const raw = await res.text()
    if (!res.ok) {
      return {
        success: false,
        channel: 'whatsapp',
        error: `Cartat API status ${res.status}: ${raw.slice(0, 300)}`,
      }
    }

    let status: string | undefined
    try {
      status = JSON.parse(raw)?.status
    } catch {
      // Unparseable body: treated as a failure below.
    }

    return status?.toLowerCase() === 'success'
      ? { success: true, channel: 'whatsapp' }
      : { success: false, channel: 'whatsapp', error: `Cartat status: ${status ?? 'unknown'}` }
  } catch (error: any) {
    return {
      success: false,
      channel: 'whatsapp',
      error: `Cartat request failed: ${error?.message ?? error}`,
    }
  }
}

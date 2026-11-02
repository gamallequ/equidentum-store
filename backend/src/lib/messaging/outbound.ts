import { MESSAGING_PRIMARY_CHANNEL } from '../constants'
import { maskPhone } from '../phone'
import { isCartatConfigured, sendCartatWhatsApp } from './cartat-whatsapp'
import { isFgcSmsConfigured, sendFgcSms } from './fgc-sms'
import { MessagingChannel, SendResult } from './types'

export type { MessagingChannel, SendResult } from './types'

type Copy = { sms: string; whatsapp: string }

const senders: Record<MessagingChannel, (phone: string, text: string) => Promise<SendResult>> = {
  sms: sendFgcSms,
  whatsapp: sendCartatWhatsApp,
}

const isConfigured: Record<MessagingChannel, () => boolean> = {
  sms: isFgcSmsConfigured,
  whatsapp: isCartatConfigured,
}

/**
 * Sends one text message, trying the primary channel first and the other
 * configured channel when that fails. Port of OutboundMessagingService.cs,
 * except that the .NET API's DisableSmsFallback switch is always on: with
 * WhatsApp as primary, a failed WhatsApp send is not retried as SMS.
 *
 * Each channel gets its own copy. SMS stays short and plain so it fits in one
 * segment; WhatsApp can use formatting.
 *
 * With no channel configured, development logs the message so the flow can be
 * tested locally. Production returns a failure rather than pretending it sent.
 */
export async function sendTextMessage(phone: string, copy: Copy): Promise<SendResult> {
  const primary = MESSAGING_PRIMARY_CHANNEL
  const fallback: MessagingChannel = primary === 'sms' ? 'whatsapp' : 'sms'

  if (!isConfigured.sms() && !isConfigured.whatsapp()) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[messaging] No SMS/WhatsApp provider configured. Message to ${phone}:\n${copy.sms}`)
      return { success: true, channel: primary }
    }
    return { success: false, channel: primary, error: 'No messaging channel is configured' }
  }

  const first = isConfigured[primary]() ? primary : fallback
  const firstResult = await senders[first](phone, copy[first])
  if (firstResult.success) return firstResult

  const canFallBack = first === 'sms' && isConfigured.whatsapp()
  if (!canFallBack) {
    console.warn(`[messaging] ${first} send to ${maskPhone(phone)} failed: ${firstResult.error}`)
    return firstResult
  }

  console.warn(
    `[messaging] SMS send to ${maskPhone(phone)} failed, falling back to WhatsApp: ${firstResult.error}`
  )
  const fallbackResult = await senders.whatsapp(phone, copy.whatsapp)
  if (!fallbackResult.success) {
    console.warn(`[messaging] WhatsApp send to ${maskPhone(phone)} failed: ${fallbackResult.error}`)
  }
  return fallbackResult
}

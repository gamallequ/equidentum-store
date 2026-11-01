export type MessagingChannel = 'sms' | 'whatsapp'

export type SendResult = {
  success: boolean
  channel: MessagingChannel
  error?: string
}

const TIMEOUT_MS = 30_000

/** fetch with the 30 second timeout both providers use in the .NET API. */
export function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
}

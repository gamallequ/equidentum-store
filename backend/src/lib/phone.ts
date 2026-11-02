import { PHONE_DEFAULT_COUNTRY_CODE } from './constants'

/**
 * Turns what a shopper types into one E.164 number (`+9665XXXXXXXX`), or null
 * when it cannot be a phone number.
 *
 * Phone sign-in looks accounts up by this string, so every caller has to
 * normalize the same way. Otherwise `0501234567` and `+966501234567` would be
 * two different accounts. The rules are the ones the Cartat and FGC clients in
 * the stable-management API apply:
 *   +966501234567 / 00966501234567  -> kept as an international number
 *   966501234567                    -> already has the country code
 *   0501234567                      -> trunk 0 replaced by the country code
 *   501234567                       -> country code prepended
 */
export function normalizePhone(
  input: unknown,
  countryCode: string = PHONE_DEFAULT_COUNTRY_CODE
): string | null {
  if (typeof input !== 'string') return null

  const trimmed = input.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (trimmed.startsWith('+')) {
    // Already international.
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (digits.startsWith(countryCode)) {
    // Already carries the default country code.
  } else if (digits.startsWith('0')) {
    digits = countryCode + digits.slice(1)
  } else if (digits.length < 11) {
    digits = countryCode + digits
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null
}

/** Masks all but the last four digits, for logs. */
export function maskPhone(phone: string): string {
  return phone.length < 4 ? '***' : '*'.repeat(phone.length - 4) + phone.slice(-4)
}

import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { sendTextMessage } from '../lib/messaging/outbound'
import { maskPhone, normalizePhone } from '../lib/phone'

/**
 * Texts the shopper when an order is placed: SMS first, WhatsApp as fallback
 * (see lib/messaging/outbound). Runs next to the confirmation email in
 * order-placed.ts, in its own subscriber so a failure in one never stops the
 * other.
 *
 * The number comes from the customer account (set by phone sign-in), then the
 * shipping and billing addresses, so guest orders are covered too. An order
 * with no usable number is skipped.
 */
export default async function orderPlacedSmsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const {
      data: [order],
    } = await query.graph({
      entity: 'order',
      fields: [
        'id',
        'display_id',
        'total',
        'currency_code',
        'customer.phone',
        'customer.first_name',
        'shipping_address.phone',
        'shipping_address.first_name',
        'billing_address.phone',
      ],
      filters: { id: data.id },
    })

    if (!order) return

    const phone = [
      order.customer?.phone,
      order.shipping_address?.phone,
      order.billing_address?.phone,
    ]
      .map((p) => normalizePhone(p))
      .find(Boolean)

    if (!phone) {
      logger.info(`Order ${order.id} has no phone number, skipping the order SMS`)
      return
    }

    const storeName = process.env.STORE_NAME || 'Equidentum'
    const orderNo = `#${order.display_id}`
    const total = formatAmount(Number(order.total), order.currency_code)
    const firstName = order.customer?.first_name || order.shipping_address?.first_name

    const sent = await sendTextMessage(phone, {
      sms: `${storeName}: thank you! Your order ${orderNo} (${total}) has been received. We'll let you know when it ships.`,
      whatsapp:
        `*${storeName}*\n\n` +
        `${firstName ? `Hi ${firstName}, thank` : 'Thank'} you for your order!\n\n` +
        `Order: *${orderNo}*\nTotal: *${total}*\n\n` +
        `We'll let you know when it ships.`,
    })

    if (!sent.success) {
      logger.warn(`Order SMS for ${order.id} to ${maskPhone(phone)} failed: ${sent.error}`)
    }
  } catch (error) {
    logger.error(`Error sending the order SMS for ${data.id}: ${error}`)
  }
}

function formatAmount(amount: number, currency?: string | null): string {
  const code = (currency || 'SAR').toUpperCase()
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${code}`
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}

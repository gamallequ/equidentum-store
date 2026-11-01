import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { FulfillmentEvents } from '@medusajs/framework/utils'
import { revalidateStorefront } from '../lib/revalidate-storefront'

// Which options a cart is offered depends on the option itself, its rules and
// the service and geo zones it sits in, so a change to any of them purges the
// storefront's cached shipping option lists.
//
// Price edits are not covered: prices live in the pricing module, which does
// not emit an event naming the shipping option. The storefront's 60s TTL on
// these lists picks those up.
export default async function shippingChangedHandler({ event }: SubscriberArgs<any>) {
  await revalidateStorefront(['catalog-shipping'], event.name)
}

export const config: SubscriberConfig = {
  event: [
    FulfillmentEvents.SHIPPING_OPTION_CREATED,
    FulfillmentEvents.SHIPPING_OPTION_UPDATED,
    FulfillmentEvents.SHIPPING_OPTION_DELETED,
    FulfillmentEvents.SHIPPING_OPTION_RULE_CREATED,
    FulfillmentEvents.SHIPPING_OPTION_RULE_UPDATED,
    FulfillmentEvents.SHIPPING_OPTION_RULE_DELETED,
    FulfillmentEvents.SERVICE_ZONE_CREATED,
    FulfillmentEvents.SERVICE_ZONE_UPDATED,
    FulfillmentEvents.SERVICE_ZONE_DELETED,
    FulfillmentEvents.GEO_ZONE_CREATED,
    FulfillmentEvents.GEO_ZONE_UPDATED,
    FulfillmentEvents.GEO_ZONE_DELETED,
  ],
}

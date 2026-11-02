import { authenticate, defineMiddlewares } from '@medusajs/framework/http'

export default defineMiddlewares({
  routes: [
    {
      // Called with the token from a verified phone code that has no customer
      // yet, so unregistered tokens must be let through. Bearer only: the
      // storefront keeps the token server-side and sends it as a header.
      matcher: '/store/phone-auth/link',
      method: ['POST'],
      middlewares: [authenticate('customer', ['bearer'], { allowUnregistered: true })],
    },
  ],
})

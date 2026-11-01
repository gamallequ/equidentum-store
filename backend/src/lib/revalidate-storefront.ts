import { REVALIDATE_SECRET, STOREFRONT_URL } from './constants'

/**
 * Asks the storefront to purge shared cache tags through its /api/revalidate
 * endpoint. Tags must be ones the storefront allows there, which are the
 * catalog-* tags built from CATALOG_TAGS in storefront/src/lib/data/cookies.ts.
 *
 * Never let a storefront outage fail an admin operation. The storefront's
 * cache TTL picks the change up on its own if this call is lost.
 */
export const revalidateStorefront = async (tags: string[], eventName: string) => {
  if (!REVALIDATE_SECRET) {
    return
  }

  try {
    const response = await fetch(`${STOREFRONT_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tags }),
    })

    if (!response.ok) {
      console.error(`Storefront revalidation after ${eventName} failed: ${response.status}`)
    }
  } catch (error) {
    console.error(error)
  }
}

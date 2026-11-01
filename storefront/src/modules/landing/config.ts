/**
 * Every outbound link on the landing page, in one place.
 *
 * All of them can be overridden per deployment through environment variables,
 * so marketing can repoint a button without a code change. Values are read as
 * literal `process.env.NEXT_PUBLIC_*` expressions on purpose: Next only inlines
 * public env vars into client bundles when they are spelled out in full.
 *
 * A link may be:
 * - a store path such as "/store" or "/categories/grooming", which is prefixed
 *   with the visitor's country code, the same as every other storefront link;
 * - an absolute URL ("https://...", "mailto:...", "tel:..."), used as is;
 * - an in-page anchor ("#collection"), which scrolls smoothly.
 */

const value = (raw: string | undefined) => {
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

export type SocialLink = { label: string; href: string }

export const LANDING_LINKS = {
  /** Where "Shop Now", "Explore the Collection" and "Shop Equidentum" go. */
  store: value(process.env.NEXT_PUBLIC_LANDING_STORE_URL) ?? "/store",
  /** The main Equidentum website, shown in the footer when set. */
  website: value(process.env.NEXT_PUBLIC_EQUIDENTUM_WEBSITE_URL),
  /** Contact page or mailto: link, shown in the footer when set. */
  contact: value(process.env.NEXT_PUBLIC_CONTACT_URL),
  /** Social profiles. Only the ones that are set are rendered. */
  social: [
    { label: "Instagram", href: value(process.env.NEXT_PUBLIC_INSTAGRAM_URL) },
    { label: "Facebook", href: value(process.env.NEXT_PUBLIC_FACEBOOK_URL) },
    { label: "TikTok", href: value(process.env.NEXT_PUBLIC_TIKTOK_URL) },
    { label: "YouTube", href: value(process.env.NEXT_PUBLIC_YOUTUBE_URL) },
  ].filter((link): link is SocialLink => Boolean(link.href)),
}

/**
 * Handle of the Medusa collection shown in "Selected for Excellence". When
 * unset, or when no collection has that handle, the newest products are shown.
 */
export const FEATURED_COLLECTION_HANDLE = value(
  process.env.NEXT_PUBLIC_LANDING_FEATURED_COLLECTION
)

/** How many products the horizontal showcase holds. */
export const FEATURED_PRODUCT_LIMIT = 8

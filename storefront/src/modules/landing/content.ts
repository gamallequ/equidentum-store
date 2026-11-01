/**
 * Copy and photography for the landing page.
 *
 * Photography rule: horses, tack, stables and equestrian landscapes only. No
 * women or girls anywhere in frame, background included. When a person is
 * genuinely needed, a male equestrian. Every image in /public/landing was
 * checked against this, and the hero was cropped to remove a rider's hand.
 * Check any replacement the same way. Sources are listed in
 * /public/landing/CREDITS.md.
 *
 * Product names, prices and descriptions never live here: the featured
 * collection reads them from Medusa, so nothing on the page can drift from
 * what the store actually sells.
 */

export type LandingImage = {
  src: string
  alt: string
  /** CSS object-position, to keep the subject in frame on narrow screens. */
  position?: string
}

const img = (name: string, alt: string, position?: string): LandingImage => ({
  src: `/landing/${name}.webp`,
  alt,
  position,
})

export const HERO = {
  eyebrow: "The Equidentum Collection",
  headline: ["Beyond the Ordinary.", "Into the Exceptional."],
  body: "Discover the world of Equidentum. A curated collection of essentials for horses, their care, and the equestrian lifestyle.",
  primaryCta: "Explore the Collection",
  secondaryCta: "Discover Equidentum",
  image: img(
    "hero-bay-bridle",
    "A bay horse in a black leather bridle, lit against a dark background",
    "68% 40%"
  ),
}

export const BRAND = {
  eyebrow: "Our Story",
  headline: "Because Every Horse Deserves Excellence.",
  body: "Every detail matters. From everyday care to the finest equestrian essentials, discover products selected with quality, functionality, and the horse in mind.",
  cta: "Explore the Collection",
  image: img(
    "portrait-bay",
    "Portrait of a bay horse wearing a bridle with a pearl browband",
    "50% 30%"
  ),
}

export type LandingCategory = {
  name: string
  /** Medusa category handle. Linked when it exists, otherwise the store. */
  handle: string
  caption: string
  image: LandingImage
}

export const CATEGORIES_SECTION = {
  eyebrow: "Categories",
  headline: "Everything They Deserve.",
}

export const CATEGORIES: LandingCategory[] = [
  {
    name: "Horse Care",
    handle: "horse-care",
    caption: "Everyday wellbeing",
    image: img("category-horse-care", "A chestnut horse with a white blaze in its stable", "45% 50%"),
  },
  {
    name: "Riding Essentials",
    handle: "riding-essentials",
    caption: "Ready for the ride",
    image: img("category-riding", "A grey horse wearing a bridle and ear bonnet", "60% 35%"),
  },
  {
    name: "Saddles & Tack",
    handle: "saddles-tack",
    caption: "Crafted leather",
    image: img("category-saddles-tack", "Saddles, collars and bridles hanging on a wooden tack room wall"),
  },
  {
    name: "Stable Accessories",
    handle: "stable-accessories",
    caption: "A well-kept home",
    image: img("category-stable", "A horse standing in a sunlit stable aisle", "50% 60%"),
  },
  {
    name: "Grooming Essentials",
    handle: "grooming-essentials",
    caption: "The daily ritual",
    image: img("category-grooming", "Natural bristle grooming brushes with wooden handles"),
  },
]

export const FEATURED_SECTION = {
  eyebrow: "The Collection",
  headline: "Selected for Excellence.",
  body: "A considered edit of essentials from the Equidentum store.",
  productCta: "Explore Product",
  viewAll: "View the full collection",
  empty: "The collection is being prepared. Visit the store to see everything available today.",
}

export const STORY = {
  words: ["Strength.", "Elegance.", "Connection."],
  closing: "Made for the bond between a horse and the people who care for it.",
  wide: img(
    "story-arena-night",
    "Horses cantering through a dark indoor arena under a single pool of light"
  ),
  detail: img("story-hooves", "Close view of a horse's hooves striking the sand mid-stride", "50% 40%"),
}

export const WHY = {
  eyebrow: "Why Equidentum",
  headline: "More Than a Collection.",
  intro: "Three principles guide every product we choose.",
  features: [
    {
      title: "Quality That Matters",
      body: "Materials and finishes chosen to perform day after day, in the stable and in the saddle.",
      image: img("why-saddle", "A black leather saddle with a canvas saddlebag on a woven pad"),
    },
    {
      title: "Designed Around Horses",
      body: "Every piece is considered from the horse's point of view first: comfort, fit and wellbeing.",
      image: img("why-bridle", "Black and white portrait of a horse in a leather bridle", "50% 30%"),
    },
    {
      title: "Essentials for Every Journey",
      body: "From the morning groom to the long ride out, everything you need in one considered collection.",
      image: img("why-meadow", "A bay horse galloping across a green meadow", "55% 50%"),
    },
  ],
}

export const FINAL_CTA = {
  headline: "Your Equestrian Journey Starts Here.",
  body: "Explore the Equidentum collection and discover essentials selected for the horses you care about.",
  cta: "Shop Equidentum",
  image: img(
    "final-black-horse",
    "A black horse standing in profile against a dusky sky",
    "35% 50%"
  ),
}

export const NAV_LINKS = [
  { label: "Collection", href: "#collection" },
  { label: "Our Story", href: "#story" },
  { label: "Categories", href: "#categories" },
]

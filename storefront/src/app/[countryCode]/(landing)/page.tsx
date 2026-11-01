import { Metadata } from "next"

import LandingTemplate from "@modules/landing/templates"
import { getStoreName } from "@lib/util/env"

export const metadata: Metadata = {
  title: `${getStoreName()} | Premium Horse Accessories & Equestrian Essentials`,
  description:
    "Discover the world of Equidentum. A curated collection of essentials for horses, their care, and the equestrian lifestyle.",
}

export default async function Home(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  return <LandingTemplate countryCode={countryCode} />
}

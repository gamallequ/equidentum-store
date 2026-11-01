import Image from "next/image"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LANDING_LINKS } from "../config"
import LandingLink from "./landing-link"
import { FOCUS } from "./primitives"

type FooterCategory = { id: string; name: string; handle: string }

const LINK = `${FOCUS} text-equidentum-ivory/70 transition-colors hover:text-equidentum-ivory focus-visible:outline-equidentum-champagne`

/**
 * Section 8. Logo, the store's top-level categories, outbound links and the
 * copyright line. Website, contact and social links only appear once they are
 * configured (see config.ts), so the footer never shows a dead link.
 */
export default function LandingFooter({
  storeName,
  categories,
}: {
  storeName: string
  categories: FooterCategory[]
}) {
  const outbound = [
    { label: "Shop", href: LANDING_LINKS.store },
    ...(LANDING_LINKS.website ? [{ label: "Equidentum.com", href: LANDING_LINKS.website }] : []),
    ...(LANDING_LINKS.contact ? [{ label: "Contact", href: LANDING_LINKS.contact }] : []),
    ...LANDING_LINKS.social,
  ]

  return (
    <footer className="bg-equidentum text-equidentum-ivory">
      <div className="mx-auto max-w-[1600px] px-6 pb-10 pt-20 small:px-10 small:pt-28">
        <div className="flex flex-col gap-14 small:flex-row small:items-start small:justify-between">
          <LocalizedClientLink
            href="/"
            className={`${FOCUS} self-start focus-visible:outline-equidentum-champagne`}
          >
            <Image
              src="/brand/equidentum-logo-light.png"
              alt=""
              width={134}
              height={38}
              className="h-9 w-auto"
            />
            <span className="sr-only">{storeName}</span>
          </LocalizedClientLink>

          <div className="grid grid-cols-1 gap-12 xsmall:grid-cols-2 small:gap-24">
            {categories.length > 0 && (
              <div>
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.3em] text-equidentum-champagne">
                  Categories
                </p>
                <ul data-testid="footer-categories" className="flex flex-col gap-3 text-sm">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <LocalizedClientLink
                        href={`/categories/${category.handle}`}
                        className={LINK}
                        data-testid="category-link"
                      >
                        {category.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.3em] text-equidentum-champagne">
                Equidentum
              </p>
              <ul className="flex flex-col gap-3 text-sm">
                {outbound.map((link) => (
                  <li key={link.label}>
                    <LandingLink href={link.href} className={LINK}>
                      {link.label}
                    </LandingLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-equidentum-ivory/15 pt-8 text-xs text-equidentum-ivory/55 xsmall:flex-row xsmall:items-center xsmall:justify-between">
          <p>
            © {new Date().getFullYear()} {storeName}. All rights reserved.
          </p>
          <p className="font-display text-sm italic text-equidentum-ivory/45">
            Beyond the ordinary.
          </p>
        </div>
      </div>
    </footer>
  )
}

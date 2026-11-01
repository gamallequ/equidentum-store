"use client"

import { AnimatePresence, motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { LANDING_LINKS } from "../config"
import { NAV_LINKS } from "../content"
import LandingLink from "./landing-link"
import { BUTTON, FOCUS } from "./primitives"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Transparent over the hero, then a solid deep-purple bar once the visitor
 * scrolls. It slides away while reading downwards and returns on the first
 * scroll up, so it never sits over the photography for long.
 *
 * Account, cart and search stay reachable here because the landing page
 * replaces the store's own header on the homepage. The cart is rendered on the
 * server and passed in, so it keeps its live count and dropdown.
 */
export default function LandingNav({
  storeName,
  cart,
  searchEnabled,
}: {
  storeName: string
  cart: React.ReactNode
  searchEnabled: boolean
}) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      // Small deltas are ignored so trackpad jitter does not flicker the bar.
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > window.innerHeight * 0.6)
        last = y
      }
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  const solid = scrolled || menuOpen

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: hidden && !menuOpen ? "-100%" : 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`fixed inset-x-0 top-0 z-50 text-equidentum-ivory transition-colors duration-500 ${
          solid
            ? "border-b border-equidentum-champagne/15 bg-equidentum"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav
          aria-label="Main"
          className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-x-6 px-6 small:h-[84px] small:px-10"
        >
          <LocalizedClientLink
            href="/"
            className={`${FOCUS} flex shrink-0 items-center focus-visible:outline-equidentum-champagne`}
            data-testid="nav-store-link"
          >
            <Image
              src="/brand/equidentum-logo-light.png"
              alt=""
              width={134}
              height={38}
              priority
              className="h-7 w-auto small:h-8"
            />
            <span className="sr-only">{storeName}</span>
          </LocalizedClientLink>

          <ul className="hidden items-center gap-x-10 small:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <LandingLink
                  href={link.href}
                  className={`${FOCUS} group relative py-2 text-[12px] font-bold uppercase tracking-[0.24em] text-equidentum-ivory/85 transition-colors hover:text-equidentum-ivory focus-visible:outline-equidentum-champagne`}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-equidentum-champagne transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none"
                  />
                </LandingLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-x-5 text-[12px] font-bold uppercase tracking-[0.2em] small:gap-x-7">
            {searchEnabled && (
              <LocalizedClientLink
                href="/search"
                scroll={false}
                className={`${FOCUS} hidden text-equidentum-ivory/80 hover:text-equidentum-ivory focus-visible:outline-equidentum-champagne medium:block`}
                data-testid="nav-search-link"
              >
                Search
              </LocalizedClientLink>
            )}
            <LocalizedClientLink
              href="/account"
              className={`${FOCUS} hidden text-equidentum-ivory/80 hover:text-equidentum-ivory focus-visible:outline-equidentum-champagne small:block`}
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <div className="flex h-[72px] items-center text-equidentum-ivory/80 hover:text-equidentum-ivory small:h-[84px]">
              {cart}
            </div>
            <LandingLink
              href={LANDING_LINKS.store}
              className={`${BUTTON} ${FOCUS} hidden min-h-[44px] border border-equidentum-champagne/70 px-6 text-equidentum-ivory hover:bg-equidentum-champagne hover:text-equidentum-charcoal focus-visible:outline-equidentum-champagne small:inline-flex`}
              data-testid="nav-shop-now"
            >
              Shop Now
            </LandingLink>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="landing-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={`${FOCUS} -me-2 flex h-11 w-11 flex-col items-center justify-center gap-y-[7px] focus-visible:outline-equidentum-champagne small:hidden`}
            >
              <span
                className={`block h-px w-6 bg-current transition-transform duration-300 ${menuOpen ? "translate-y-1 rotate-45" : ""}`}
              />
              <span
                className={`block h-px w-6 bg-current transition-transform duration-300 ${menuOpen ? "-translate-y-1 -rotate-45" : ""}`}
              />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="landing-menu"
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-equidentum px-6 pb-10 pt-28 text-equidentum-ivory small:hidden"
          >
            <ul className="flex flex-col gap-y-2">
              {[...NAV_LINKS, { label: "Shop Now", href: LANDING_LINKS.store }].map(
                (link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.06, duration: 0.6, ease: EASE }}
                  >
                    <LandingLink
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`${FOCUS} block py-2 font-display text-5xl font-light focus-visible:outline-equidentum-champagne`}
                    >
                      {link.label}
                    </LandingLink>
                  </motion.li>
                )
              )}
            </ul>
            <div className="flex gap-x-8 text-[12px] font-bold uppercase tracking-[0.24em] text-equidentum-ivory/75">
              <LocalizedClientLink href="/account" onClick={() => setMenuOpen(false)}>
                Account
              </LocalizedClientLink>
              {searchEnabled && (
                <LocalizedClientLink href="/search" onClick={() => setMenuOpen(false)}>
                  Search
                </LocalizedClientLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

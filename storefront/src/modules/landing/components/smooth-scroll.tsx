"use client"

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import Lenis from "lenis"
import { MotionConfig } from "framer-motion"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react"

gsap.registerPlugin(ScrollTrigger, useGSAP)

type ScrollTarget = string | HTMLElement

const ScrollContext = createContext<(target: ScrollTarget) => void>(() => {})

/** Smoothly scrolls to an element or "#id", honouring reduced motion. */
export const useScrollTo = () => useContext(ScrollContext)

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Landing page shell: Lenis smooth scrolling driven by GSAP's ticker, so
 * ScrollTrigger and Lenis share one clock and pinned sections never jitter.
 *
 * Lenis is skipped entirely under prefers-reduced-motion, which leaves native
 * scrolling. It is created here rather than app-wide, so the store, cart and
 * checkout keep their ordinary scroll behaviour.
 *
 * Also owns the background colour transitions: each transparent section
 * declares the colour it wants with `data-bg`, and the shell eases between
 * them as the visitor scrolls, so ivory and purple chapters dissolve into one
 * another instead of meeting at a hard edge. Full-bleed photographic sections
 * paint their own background and carry no `data-bg`, so they never recolour
 * the tail of the section before them.
 */
export default function SmoothScroll({
  children,
  initialBackground,
}: {
  children: React.ReactNode
  initialBackground: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Pinned sections measure the page once. Web fonts and late images change
  // heights, so measure again once they have settled.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener("load", refresh)
    return () => window.removeEventListener("load", refresh)
  }, [])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const instant = prefersReducedMotion()
      const sections = gsap.utils.toArray<HTMLElement>("[data-bg]", root)

      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          // Switch as the boundary between two sections passes near the
          // bottom of the screen, in both directions, so the incoming
          // section's copy never sits on the outgoing section's colour.
          start: "top 88%",
          end: "bottom 88%",
          onToggle: (self) => {
            if (!self.isActive) return
            gsap.to(root, {
              backgroundColor: section.dataset.bg,
              duration: instant ? 0 : 0.9,
              ease: "power2.out",
              overwrite: "auto",
            })
          },
        })
      })
    },
    { scope: rootRef }
  )

  const scrollTo = useCallback((target: ScrollTarget) => {
    const element =
      typeof target === "string" ? document.querySelector<HTMLElement>(target) : target
    if (!element) return

    if (lenisRef.current) {
      lenisRef.current.scrollTo(element, { duration: 1.6 })
    } else {
      element.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" })
    }

    // Move focus for keyboard and screen reader users, without a second jump.
    element.setAttribute("tabindex", "-1")
    element.focus({ preventScroll: true })
  }, [])

  return (
    <ScrollContext.Provider value={scrollTo}>
      {/* "user" turns Framer Motion transforms off under reduced motion while
          keeping opacity fades, so content still appears gently. */}
      <MotionConfig reducedMotion="user">
        <div
          ref={rootRef}
          data-testid="landing-page"
          className="relative overflow-x-clip font-sans text-equidentum-ivory antialiased"
          style={{ backgroundColor: initialBackground }}
        >
          {children}
        </div>
      </MotionConfig>
    </ScrollContext.Provider>
  )
}

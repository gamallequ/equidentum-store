"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRef } from "react"

import { LANDING_LINKS } from "../config"
import { HERO } from "../content"
import LandingLink from "./landing-link"
import { ArrowRight, BUTTON, FOCUS } from "./primitives"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Section 1. A full-screen portrait that settles from a slow zoom on load,
 * a headline that rises line by line, then the calls to action.
 *
 * Load-in is Framer Motion; the scroll-away (parallax drift and the copy
 * lifting out) is GSAP. They drive different elements so they never compete
 * for the same transform.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const scroll = {
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        }
        gsap.to("[data-hero-media]", { yPercent: 18, ease: "none", scrollTrigger: scroll })
        gsap.to("[data-hero-copy]", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { ...scroll, end: "70% top" } })
        gsap.to("[data-hero-shade]", { opacity: 0.85, ease: "none", scrollTrigger: scroll })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      data-testid="hero"
      className="relative isolate flex h-[100svh] min-h-[620px] items-end overflow-hidden bg-equidentum-charcoal"
    >
      <div data-hero-media className="absolute inset-0 -z-20 will-change-transform">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.16 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 3.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={HERO.image.src}
            alt={HERO.image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: HERO.image.position }}
          />
        </motion.div>
      </div>

      {/* Legibility shading: the copy sits on the dark side of the photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(11,10,11,0.82)_0%,rgba(11,10,11,0.45)_45%,rgba(11,10,11,0)_75%),linear-gradient(0deg,rgba(11,10,11,0.75)_0%,rgba(11,10,11,0)_45%)]"
      />
      <div
        data-hero-shade
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[#0B0A0B] opacity-0"
      />

      <div
        data-hero-copy
        className="mx-auto w-full max-w-[1600px] px-6 pb-24 small:px-10 small:pb-28 medium:pb-32"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: EASE }}
          className="mb-8 text-[11px] font-bold uppercase tracking-[0.36em] text-equidentum-champagne"
        >
          {HERO.eyebrow}
        </motion.p>

        <h1
          id="hero-title"
          className="max-w-[14ch] font-display text-[clamp(3rem,8.4vw,8.5rem)] font-light leading-[0.95] tracking-[-0.02em]"
        >
          {HERO.headline.map((line, index) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className={`block ${index === 1 ? "italic text-equidentum-champagne" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.45 + index * 0.18, duration: 1.3, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-10 flex flex-col gap-10 small:flex-row small:items-end small:justify-between">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 1.1, ease: EASE }}
            className="max-w-[30rem] text-base leading-7 text-equidentum-ivory/80 small:text-lg small:leading-8"
          >
            {HERO.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 1.1, ease: EASE }}
            className="flex flex-col gap-3 xsmall:flex-row"
          >
            <LandingLink
              href={LANDING_LINKS.store}
              className={`${BUTTON} ${FOCUS} bg-equidentum-ivory text-equidentum-charcoal hover:bg-equidentum-champagne focus-visible:outline-equidentum-ivory`}
              data-testid="hero-shop-button"
            >
              {HERO.primaryCta}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
            </LandingLink>
            <LandingLink
              href="#story"
              className={`${BUTTON} ${FOCUS} border border-equidentum-ivory/40 text-equidentum-ivory hover:border-equidentum-ivory hover:bg-equidentum-ivory/10 focus-visible:outline-equidentum-ivory`}
            >
              {HERO.secondaryCta}
            </LandingLink>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue: a hairline that draws downwards on a loop. */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-y-3 small:flex"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-equidentum-ivory/60">
          Scroll
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-equidentum-ivory/20">
          <span className="eq-scroll-cue absolute inset-x-0 top-0 h-1/2 bg-equidentum-champagne" />
        </span>
      </motion.div>
    </section>
  )
}

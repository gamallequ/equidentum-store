"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { LANDING_LINKS } from "../config"
import { FINAL_CTA } from "../content"
import LandingLink from "./landing-link"
import { ArrowRight, BUTTON, FOCUS, SplitWords } from "./primitives"

/**
 * Section 7. One last full-bleed photograph, a headline that rises word by
 * word, and the single action the whole page has been building towards.
 */
export default function FinalCta() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-final-media]",
          { yPercent: -12, scale: 1.12 },
          {
            yPercent: 12,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
          }
        )

        gsap
          .timeline({ scrollTrigger: { trigger: "[data-final-copy]", start: "top 80%" } })
          .fromTo("[data-final-copy] [data-word]", { yPercent: 110 }, { yPercent: 0, stagger: 0.05, duration: 1.2, ease: "expo.out" })
          .fromTo("[data-final-reveal]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: "power3.out" }, "-=0.7")
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      aria-labelledby="final-title"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden text-equidentum-ivory"
    >
      <div data-final-media className="absolute inset-0 -z-20 will-change-transform">
        <Image
          src={FINAL_CTA.image.src}
          alt={FINAL_CTA.image.alt}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: FINAL_CTA.image.position }}
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[#0B0A0B]/45" />

      <div data-final-copy className="mx-auto flex w-full max-w-[1600px] flex-col items-start px-6 py-32 small:items-end small:px-10 small:text-right">
        <h2
          id="final-title"
          className="max-w-[12ch] font-display text-[clamp(3rem,7.5vw,8rem)] font-light leading-[0.95] tracking-[-0.02em]"
        >
          <SplitWords text={FINAL_CTA.headline} />
        </h2>
        <p data-final-reveal className="mt-10 max-w-md text-lg leading-8 text-equidentum-ivory/80">
          {FINAL_CTA.body}
        </p>
        <div data-final-reveal className="mt-12">
          <LandingLink
            href={LANDING_LINKS.store}
            className={`${BUTTON} ${FOCUS} min-h-[60px] bg-equidentum-ivory px-10 text-equidentum hover:bg-equidentum-champagne hover:text-equidentum-charcoal focus-visible:outline-equidentum-ivory`}
            data-testid="final-shop-button"
          >
            {FINAL_CTA.cta}
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </LandingLink>
        </div>
      </div>
    </section>
  )
}

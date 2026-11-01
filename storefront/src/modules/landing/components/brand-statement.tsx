"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { LANDING_LINKS } from "../config"
import { BRAND } from "../content"
import LandingLink from "./landing-link"
import { ArrowRight, Eyebrow, FOCUS, LANDING_COLORS, SplitWords } from "./primitives"

/**
 * Section 2. The page turns from the dark hero to ivory. On wide screens the
 * section pins while the portrait opens upwards like a curtain and the
 * headline darkens word by word, as if being read aloud. Narrow screens get
 * a lighter, unpinned version of the same reveal.
 */
export default function BrandStatement() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean }

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: desktop
              ? { trigger: ref.current, start: "top top", end: "+=120%", scrub: 0.8, pin: true }
              : { trigger: ref.current, start: "top 75%", end: "bottom 60%", scrub: 0.8 },
          })

          tl.fromTo("[data-brand-frame]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
            .fromTo("[data-brand-image]", { scale: 1.35 }, { scale: 1, duration: 1.4 }, 0)
            .fromTo("[data-brand-headline] [data-word]", { opacity: 0.12 }, { opacity: 1, stagger: 0.08, duration: 0.3 }, 0.2)
            .fromTo("[data-brand-reveal]", { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 }, 0.9)
        }
      )
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      id="story"
      aria-labelledby="story-title"
      data-bg={LANDING_COLORS.ivory}
      className="relative scroll-mt-0 overflow-hidden text-equidentum-charcoal focus:outline-none small:h-[100svh] small:min-h-[680px]"
    >
      <div className="mx-auto grid h-full max-w-[1600px] grid-cols-1 items-center gap-12 px-6 py-24 small:grid-cols-12 small:gap-16 small:px-10 small:py-0">
        <div className="small:col-span-5 small:h-[78%]">
          <div
            data-brand-frame
            className="relative aspect-[4/5] overflow-hidden bg-equidentum-charcoal small:aspect-auto small:h-full"
          >
            <Image
              data-brand-image
              src={BRAND.image.src}
              alt={BRAND.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover will-change-transform"
              style={{ objectPosition: BRAND.image.position }}
            />
          </div>
        </div>

        <div className="small:col-span-7 small:ps-6 medium:ps-12">
          <Eyebrow className="mb-10 text-equidentum">{BRAND.eyebrow}</Eyebrow>
          <h2
            id="story-title"
            data-brand-headline
            className="font-display text-[clamp(2.6rem,5.6vw,6rem)] font-light leading-[1.02] tracking-[-0.015em]"
          >
            <SplitWords text={BRAND.headline} />
          </h2>
          <div className="mt-12 flex max-w-xl flex-col gap-10">
            <span data-brand-reveal aria-hidden="true" className="block h-px w-24 bg-equidentum-champagne" />
            <p data-brand-reveal className="text-lg leading-8 text-equidentum-charcoal/75">
              {BRAND.body}
            </p>
            <div data-brand-reveal>
              <LandingLink
                href={LANDING_LINKS.store}
                className={`${FOCUS} group inline-flex items-center gap-x-4 border-b border-equidentum/30 pb-2 text-[12px] font-bold uppercase tracking-[0.24em] text-equidentum transition-colors hover:border-equidentum focus-visible:outline-equidentum`}
              >
                {BRAND.cta}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
              </LandingLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { WHY } from "../content"
import { Eyebrow, LANDING_COLORS, SplitWords } from "./primitives"

/**
 * Section 6. Three principles, each told with a photograph instead of an
 * icon. The columns are staggered vertically like an editorial spread; each
 * picture is unveiled from below as it enters and then drifts gently against
 * the scroll for depth.
 */
export default function WhyEquidentum() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-why-title] [data-word]",
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.06,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: "[data-why-title]", start: "top 85%" },
          }
        )

        gsap.utils.toArray<HTMLElement>("[data-why-item]", ref.current).forEach((item) => {
          const frame = item.querySelector("[data-why-frame]")
          const image = item.querySelector("[data-why-image]")
          const copy = item.querySelectorAll("[data-why-copy]")

          gsap
            .timeline({ scrollTrigger: { trigger: item, start: "top 82%" } })
            .fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" })
            .fromTo(copy, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" }, "-=0.6")

          gsap.fromTo(
            image,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: "none",
              scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true },
            }
          )
        })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      aria-labelledby="why-title"
      data-bg={LANDING_COLORS.ivory}
      className="relative text-equidentum-charcoal"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-24 small:px-10 small:py-40">
        <div className="mb-16 grid grid-cols-1 gap-8 small:mb-24 small:grid-cols-12 small:items-end">
          <div className="small:col-span-8">
            <Eyebrow className="mb-8 text-equidentum">{WHY.eyebrow}</Eyebrow>
            <h2
              id="why-title"
              data-why-title
              className="font-display text-[clamp(2.75rem,7vw,7.5rem)] font-light leading-[0.95] tracking-[-0.02em]"
            >
              <SplitWords text={WHY.headline} />
            </h2>
          </div>
          <p className="text-lg leading-8 text-equidentum-charcoal/70 small:col-span-4 small:pb-3">
            {WHY.intro}
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-16 xsmall:grid-cols-2 small:grid-cols-3 small:gap-10 medium:gap-14">
          {WHY.features.map((feature, index) => (
            <li
              key={feature.title}
              data-why-item
              className={index === 1 ? "small:mt-28" : index === 2 ? "xsmall:col-span-2 small:col-span-1 small:mt-56" : ""}
            >
              <div data-why-frame className="relative aspect-[4/5] overflow-hidden bg-equidentum-charcoal">
                <div data-why-image className="absolute -inset-y-[8%] inset-x-0 will-change-transform">
                  <Image
                    src={feature.image.src}
                    alt={feature.image.alt}
                    fill
                    sizes="(max-width: 512px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    style={{ objectPosition: feature.image.position }}
                  />
                </div>
              </div>
              <p data-why-copy className="mt-8 text-[11px] font-bold tracking-[0.3em] text-equidentum">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 data-why-copy className="mt-3 font-display text-3xl font-light leading-tight small:text-[2.25rem]">
                {feature.title}
              </h3>
              <p data-why-copy className="mt-4 max-w-sm text-base leading-7 text-equidentum-charcoal/70">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

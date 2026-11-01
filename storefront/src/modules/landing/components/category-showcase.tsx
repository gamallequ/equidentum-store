"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { CATEGORIES, CATEGORIES_SECTION, LandingCategory } from "../content"
import LandingLink from "./landing-link"
import { ArrowRight, Eyebrow, FOCUS, LANDING_COLORS, SplitWords } from "./primitives"

/**
 * Section 3. Five full-height photographic panels side by side. Hovering or
 * focusing a panel widens it and reveals its call to action, so the row reads
 * like a contact sheet being leafed through. Panels rise into place from
 * behind a mask as the section scrolls in.
 *
 * Below 1024px the panels stack into a grid of large portrait tiles, since
 * hover-to-expand means nothing on touch.
 */
export default function CategoryShowcase({ hrefs }: { hrefs: Record<string, string> }) {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-cat-title] [data-word]",
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.06,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: "[data-cat-title]", start: "top 85%" },
          }
        )

        gsap.fromTo(
          "[data-cat-panel]",
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: "[data-cat-row]", start: "top 90%", end: "top 35%", scrub: 0.8 },
          }
        )

        gsap.fromTo(
          "[data-cat-image]",
          { scale: 1.25 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: "[data-cat-row]", start: "top bottom", end: "bottom 60%", scrub: true },
          }
        )
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      id="categories"
      aria-labelledby="categories-title"
      data-bg={LANDING_COLORS.ivory}
      className="relative text-equidentum-charcoal focus:outline-none"
    >
      <div className="mx-auto max-w-[1600px] px-6 pb-20 pt-24 small:px-10 small:pb-28 small:pt-40">
        <div className="mb-14 flex flex-col gap-8 small:mb-20 small:flex-row small:items-end small:justify-between">
          <div>
            <Eyebrow className="mb-8 text-equidentum">{CATEGORIES_SECTION.eyebrow}</Eyebrow>
            <h2
              id="categories-title"
              data-cat-title
              className="font-display text-[clamp(2.75rem,7vw,7.5rem)] font-light leading-[0.95] tracking-[-0.02em]"
            >
              <SplitWords text={CATEGORIES_SECTION.headline} />
            </h2>
          </div>
          <p className="max-w-xs text-[12px] font-bold uppercase tracking-[0.24em] text-equidentum-charcoal/50">
            {String(CATEGORIES.length).padStart(2, "0")} chapters of care
          </p>
        </div>

        <ul
          data-cat-row
          className="grid grid-cols-1 gap-2 xsmall:grid-cols-2 small:flex small:h-[78vh] small:min-h-[560px] small:gap-2"
        >
          {CATEGORIES.map((category, index) => (
            <li
              key={category.handle}
              className={`small:flex-1 small:transition-[flex-grow] small:duration-700 small:ease-[cubic-bezier(.22,1,.36,1)] small:hover:flex-[2.6] small:focus-within:flex-[2.6] motion-reduce:transition-none ${
                index === CATEGORIES.length - 1 ? "xsmall:col-span-2 small:col-span-1" : ""
              }`}
            >
              <CategoryPanel
                category={category}
                href={hrefs[category.handle]}
                index={index}
                wide={index === CATEGORIES.length - 1}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function CategoryPanel({
  category,
  href,
  index,
  wide,
}: {
  category: LandingCategory
  href: string
  index: number
  wide: boolean
}) {
  return (
    <LandingLink
      href={href}
      data-cat-panel
      className={`${FOCUS} group relative flex h-full flex-col justify-end overflow-hidden bg-equidentum-charcoal text-equidentum-ivory focus-visible:outline-equidentum ${
        wide ? "aspect-[4/5] xsmall:aspect-[16/9]" : "aspect-[4/5]"
      } small:aspect-auto`}
    >
      <Image
        data-cat-image
        src={category.image.src}
        alt=""
        fill
        sizes="(max-width: 512px) 100vw, (max-width: 1024px) 50vw, 45vw"
        className="object-cover will-change-transform"
        style={{ objectPosition: category.image.position }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/0 transition-opacity duration-700 group-hover:opacity-80"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-equidentum/0 transition-colors duration-700 group-hover:bg-equidentum/20"
      />

      <span className="relative flex flex-col gap-3 p-6 small:p-7">
        <span className="text-[11px] font-bold tracking-[0.3em] text-equidentum-champagne">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-display text-3xl font-light leading-tight small:text-[2rem]">
          {category.name}
        </span>
        <span className="flex items-center gap-x-3 text-[11px] font-bold uppercase tracking-[0.26em] text-equidentum-ivory/80 small:translate-y-3 small:opacity-0 small:transition-all small:duration-500 small:group-hover:translate-y-0 small:group-hover:opacity-100 small:group-focus-visible:translate-y-0 small:group-focus-visible:opacity-100 motion-reduce:transition-none">
          {category.caption}
          <ArrowRight />
        </span>
      </span>
    </LandingLink>
  )
}

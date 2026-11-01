"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { LANDING_LINKS } from "../config"
import { FEATURED_SECTION } from "../content"
import type { FeaturedProduct } from "../data"
import LandingLink from "./landing-link"
import { ArrowRight, Eyebrow, FOCUS, LANDING_COLORS, SplitWords } from "./primitives"

/**
 * Section 4. A horizontal gallery driven by vertical scrolling: the section
 * pins and the track slides sideways as the visitor scrolls down. Each piece
 * eases out of a slight zoom as it reaches the middle of the screen.
 *
 * Every name, description and price comes from Medusa (see data.ts). Nothing
 * here is typed in by hand, so the page cannot advertise a price the store
 * does not charge.
 *
 * Below 1024px, and under reduced motion, the track is a native swipeable
 * row with scroll snapping instead of a pinned scene.
 */
export default function FeaturedCollection({ products }: { products: FeaturedProduct[] }) {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-featured-title] [data-word]",
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.06,
            duration: 1.1,
            ease: "expo.out",
            scrollTrigger: { trigger: "[data-featured-title]", start: "top 85%" },
          }
        )
      })

      if (!products.length) return

      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = trackRef.current
        if (!track) return

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.9,
            invalidateOnRefresh: true,
          },
        })

        gsap.fromTo(
          "[data-featured-progress]",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        )

        gsap.utils.toArray<HTMLElement>("[data-featured-image]", ref.current).forEach((image) => {
          gsap.fromTo(
            image,
            { scale: 1.18 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: image,
                containerAnimation: slide,
                start: "left right",
                end: "center center",
                scrub: true,
              },
            }
          )
        })
      })
    },
    { scope: ref, dependencies: [products.length] }
  )

  return (
    <section
      ref={ref}
      id="collection"
      aria-labelledby="collection-title"
      data-bg={LANDING_COLORS.purple}
      className="relative overflow-hidden text-equidentum-ivory focus:outline-none small:flex small:h-[100svh] small:min-h-[700px] small:flex-col small:justify-center"
    >
      <div className="mx-auto w-full max-w-[1600px] px-6 pt-24 small:px-10 small:pt-28">
        <div className="flex flex-col gap-8 small:flex-row small:items-end small:justify-between">
          <div>
            <Eyebrow className="mb-8 text-equidentum-champagne">{FEATURED_SECTION.eyebrow}</Eyebrow>
            <h2
              id="collection-title"
              data-featured-title
              className="font-display text-[clamp(2.75rem,6vw,6.5rem)] font-light leading-[0.95] tracking-[-0.02em]"
            >
              <SplitWords text={FEATURED_SECTION.headline} />
            </h2>
          </div>
          <div className="flex max-w-sm flex-col gap-6">
            <p className="text-base leading-7 text-equidentum-ivory/70">{FEATURED_SECTION.body}</p>
            <LandingLink
              href={LANDING_LINKS.store}
              className={`${FOCUS} group inline-flex items-center gap-x-4 self-start border-b border-equidentum-champagne/40 pb-2 text-[12px] font-bold uppercase tracking-[0.24em] text-equidentum-champagne hover:border-equidentum-champagne focus-visible:outline-equidentum-champagne`}
            >
              {FEATURED_SECTION.viewAll}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
            </LandingLink>
          </div>
        </div>
      </div>

      {products.length ? (
        <>
          <ul
            ref={trackRef}
            data-testid="featured-products"
            className="no-scrollbar mt-14 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto pe-6 ps-6 pb-20 small:mt-16 small:gap-8 small:motion-safe:snap-none small:motion-safe:overflow-visible small:pe-[14vw] small:ps-10 small:pb-0 small:will-change-transform"
          >
            {products.map((product, index) => (
              <li
                key={product.id}
                className="w-[78vw] shrink-0 snap-start xsmall:w-[46vw] small:w-[clamp(300px,26vw,440px)]"
              >
                <ProductCard product={product} index={index} />
              </li>
            ))}
            <li className="flex w-[78vw] shrink-0 snap-start xsmall:w-[46vw] small:w-[clamp(300px,26vw,440px)]">
              <LandingLink
                href={LANDING_LINKS.store}
                className={`${FOCUS} group flex aspect-[4/5] w-full flex-col justify-between border border-equidentum-champagne/30 p-8 transition-colors duration-500 hover:bg-equidentum-ivory hover:text-equidentum focus-visible:outline-equidentum-champagne`}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-equidentum-champagne group-hover:text-equidentum">
                  Equidentum
                </span>
                <span className="font-display text-4xl font-light leading-tight">
                  {FEATURED_SECTION.viewAll}
                </span>
                <ArrowRight className="h-6 w-6 transition-transform duration-300 group-hover:translate-x-2 motion-reduce:transition-none" />
              </LandingLink>
            </li>
          </ul>

          <div className="mx-auto hidden w-full max-w-[1600px] px-10 pt-10 small:block">
            <div className="h-px w-full bg-equidentum-ivory/15">
              <div data-featured-progress className="h-px origin-left bg-equidentum-champagne" />
            </div>
          </div>
        </>
      ) : (
        <div className="mx-auto w-full max-w-[1600px] px-6 pb-24 pt-14 small:px-10">
          <p className="max-w-xl font-display text-2xl font-light leading-snug text-equidentum-ivory/80">
            {FEATURED_SECTION.empty}
          </p>
        </div>
      )}
    </section>
  )
}

function ProductCard({ product, index }: { product: FeaturedProduct; index: number }) {
  return (
    <LandingLink
      href={`/products/${product.handle}`}
      className={`${FOCUS} group block focus-visible:outline-equidentum-champagne`}
      data-testid="featured-product"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-equidentum-ivory">
        {product.thumbnail ? (
          <div data-featured-image className="absolute inset-0 will-change-transform">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(max-width: 512px) 78vw, (max-width: 1024px) 46vw, 440px"
              className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06] motion-reduce:transition-none"
            />
          </div>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-equidentum/40">
            {product.title}
          </span>
        )}
        <span className="absolute start-5 top-5 text-[11px] font-bold tracking-[0.3em] text-equidentum-charcoal/60 mix-blend-multiply">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="mt-6 flex items-start justify-between gap-6">
        <h3 className="font-display text-2xl font-light leading-tight small:text-[1.75rem]">
          {product.title}
        </h3>
        {product.price && (
          <p className="shrink-0 pt-1 text-sm font-bold tracking-wide text-equidentum-champagne">
            {product.price}
          </p>
        )}
      </div>
      {product.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-equidentum-ivory/60">
          {product.description}
        </p>
      )}
      <span className="mt-5 inline-flex items-center gap-x-3 text-[11px] font-bold uppercase tracking-[0.26em] text-equidentum-ivory/80 group-hover:text-equidentum-ivory">
        {FEATURED_SECTION.productCta}
        <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
      </span>
    </LandingLink>
  )
}

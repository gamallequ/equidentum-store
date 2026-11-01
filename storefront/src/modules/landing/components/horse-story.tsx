"use client"

import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import Image from "next/image"
import { useRef } from "react"

import { STORY } from "../content"

/**
 * Section 5, the set piece. The section pins for several screens and plays
 * like a short film as the visitor scrolls:
 *
 *   1. a framed still of horses in a dark arena opens out to full bleed,
 *   2. "Strength." and "Elegance." arrive one after the other,
 *   3. the frame wipes to a close view of hooves striking the sand,
 *   4. "Connection." lands, then the closing line.
 *
 * Under reduced motion none of this runs: the markup's resting state is the
 * finished frame, with all three words visible over the arena photograph.
 */
export default function HorseStory() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const words = gsap.utils.toArray<HTMLElement>("[data-story-word]", ref.current)

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ref.current,
            start: "top top",
            end: "+=320%",
            scrub: 1,
            pin: true,
          },
        })

        tl.fromTo("[data-story-frame]", { clipPath: "inset(20% 26% 20% 26%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power1.inOut" }, 0)
          .fromTo("[data-story-wide]", { scale: 1.3 }, { scale: 1.05, duration: 2.6 }, 0)
          .fromTo("[data-story-shade]", { opacity: 0.15 }, { opacity: 0.55, duration: 1 }, 0.6)
          .set(words, { opacity: 0, yPercent: 60 }, 0)
          .to(words[0], { opacity: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, 0.9)
          .to(words[1], { opacity: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, 1.4)
          .fromTo("[data-story-detail]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 2.0)
          .fromTo("[data-story-detail-image]", { scale: 1.25, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1.8 }, 2.0)
          .to(words[2], { opacity: 1, yPercent: 0, duration: 0.5, ease: "power2.out" }, 2.6)
          .fromTo("[data-story-closing]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, 3.1)
          .to({}, { duration: 0.4 })
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      aria-label="Strength, elegance, connection"
      className="relative h-[100svh] min-h-[600px] overflow-hidden bg-[#0B0A0B] text-equidentum-ivory"
    >
      <div data-story-frame className="absolute inset-0 overflow-hidden">
        <Image
          data-story-wide
          src={STORY.wide.src}
          alt={STORY.wide.alt}
          fill
          sizes="100vw"
          className="object-cover will-change-transform"
          style={{ objectPosition: STORY.wide.position }}
        />
        <div data-story-detail className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(100% 0% 0% 0%)" }}>
          <Image
            data-story-detail-image
            src={STORY.detail.src}
            alt={STORY.detail.alt}
            fill
            sizes="100vw"
            className="object-cover will-change-transform"
            style={{ objectPosition: STORY.detail.position }}
          />
        </div>
        <div data-story-shade aria-hidden="true" className="absolute inset-0 bg-[#0B0A0B] opacity-55" />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <h2 className="flex flex-col items-center font-display text-[clamp(3.2rem,10vw,10rem)] font-light leading-[0.98] tracking-[-0.02em]">
          {STORY.words.map((word, index) => (
            <span key={word} className="block overflow-hidden pb-[0.06em]">
              <span
                data-story-word
                className={`block ${index === 1 ? "italic text-equidentum-champagne" : ""}`}
              >
                {word}
              </span>
            </span>
          ))}
        </h2>
        <p
          data-story-closing
          className="mt-10 max-w-md text-[12px] font-bold uppercase leading-6 tracking-[0.3em] text-equidentum-ivory/75"
        >
          {STORY.closing}
        </p>
      </div>
    </section>
  )
}

import { Fragment } from "react"

/**
 * Splits text into masked words for reveal animations. Each word sits in an
 * overflow-hidden mask so it can rise into view, and carries `data-word` for
 * GSAP to target. Rendered by React rather than split at runtime, so markup is
 * identical on server and client and nothing fights React over the DOM.
 *
 * Screen readers read the visually split words as one sentence, because the
 * spaces between masks are real text nodes.
 */
export function SplitWords({
  text,
  wordClassName = "",
}: {
  text: string
  wordClassName?: string
}) {
  const words = text.split(" ")
  return (
    <>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <span data-word className={`inline-block will-change-transform ${wordClassName}`}>
              {word}
            </span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  )
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={`flex items-center gap-x-4 text-[11px] font-bold uppercase tracking-[0.32em] ${className}`}
    >
      <span aria-hidden="true" className="h-px w-10 bg-current opacity-60" />
      {children}
    </p>
  )
}

export function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className={`h-4 w-4 rtl:rotate-180 ${className}`}
    >
      <path d="M3 12h17M14 6l6 6-6 6" />
    </svg>
  )
}

export const FOCUS =
  "focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"

/** Rectangular, letter-spaced buttons: quieter than pills, more editorial. */
export const BUTTON =
  "group inline-flex min-h-[52px] items-center justify-center gap-x-3 px-8 text-[12px] font-bold uppercase tracking-[0.24em] transition-colors duration-300"

export const LANDING_COLORS = {
  charcoal: "#161316",
  ivory: "#F8F5F0",
  purple: "#441752",
  black: "#0B0A0B",
}

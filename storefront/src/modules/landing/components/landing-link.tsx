"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useScrollTo } from "./smooth-scroll"

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href)

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string
  children: React.ReactNode
}

/**
 * One link component for the three kinds of destination the landing page has
 * (see config.ts): in-page anchors scroll smoothly, absolute URLs are plain
 * anchors, and store paths keep the visitor's country code.
 */
export default function LandingLink({ href, onClick, children, ...props }: Props) {
  const scrollTo = useScrollTo()

  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        onClick={(event) => {
          onClick?.(event)
          event.preventDefault()
          scrollTo(href)
          history.replaceState(null, "", href)
        }}
        {...props}
      >
        {children}
      </a>
    )
  }

  if (isExternal(href)) {
    const opensTab = href.startsWith("http")
    return (
      <a
        href={href}
        onClick={onClick}
        {...(opensTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    // LocalizedClientLink types onClick as () => void, but Next's Link passes
    // the event through, so the handler still receives it.
    <LocalizedClientLink href={href} onClick={onClick as () => void} {...props}>
      {children}
    </LocalizedClientLink>
  )
}

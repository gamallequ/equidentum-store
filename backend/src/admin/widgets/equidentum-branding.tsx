import { defineWidgetConfig } from "@medusajs/admin-sdk"

import favicon from "../assets/favicon.ico"
import logo from "../assets/equidentum-logo.png"
import logoLight from "../assets/equidentum-logo-light.png"

/**
 * Puts the Equidentum logo, favicon and tab title on the admin dashboard.
 *
 * The dashboard hardcodes Medusa's logo and tab title, and has no setting for
 * either. Rather than patching the published package, this module restyles
 * them when it loads: the admin imports every widget file at startup, so the
 * code below runs on every page, not only where the widget renders. The text
 * on the login and invite pages comes from src/admin/i18n instead.
 */

const BRAND = "Equidentum"

// The logo box shown on the login, invite, two-factor and reset-password pages.
// Only those two components (AvatarBox and LogoBox) carry this class. AvatarBox
// wraps its logo in an inner div; LogoBox puts it directly inside. Either may
// also hold a positioned checkmark badge, which is left alone.
const LOGO_BOX = '[class*="after:button-neutral-gradient"]'
const INNER = `${LOGO_BOX} > div:not(.absolute)`

const BRANDING_CSS = `
  ${LOGO_BOX} {
    width: 160px !important;
    height: 46px !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: url("${logo}") center / contain no-repeat !important;
  }
  .dark ${LOGO_BOX} {
    background-image: url("${logoLight}") !important;
  }
  ${LOGO_BOX}::after {
    display: none !important;
  }
  ${INNER} {
    background: transparent !important;
  }
  ${LOGO_BOX} > svg,
  ${INNER} > svg {
    display: none !important;
  }
`

const rebrandTitle = () => {
  if (document.title.includes("Medusa")) {
    document.title = document.title.replace(/Medusa/g, BRAND)
  }
}

const installBranding = () => {
  if (typeof document === "undefined" || document.getElementById("equidentum-branding")) {
    return
  }

  const style = document.createElement("style")
  style.id = "equidentum-branding"
  style.textContent = BRANDING_CSS
  document.head.appendChild(style)

  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!icon) {
    icon = document.createElement("link")
    icon.rel = "icon"
    document.head.appendChild(icon)
  }
  icon.href = favicon

  // The dashboard sets "<Page> - Medusa" on every navigation.
  rebrandTitle()
  new MutationObserver(rebrandTitle).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  })
}

installBranding()

const EquidentumBranding = () => null

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default EquidentumBranding

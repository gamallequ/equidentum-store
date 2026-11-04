import { defineWidgetConfig } from "@medusajs/admin-sdk"

/**
 * Sends the user to the login page once logging out succeeds.
 *
 * The dashboard's Log out item lives in a dropdown menu and passes its
 * "clear cache and go to /login" step as a callback to mutateAsync. Picking
 * the item closes the menu and unmounts it, and TanStack Query skips per-call
 * callbacks of unmounted components, so the session is destroyed but the page
 * never moves on until it is refreshed.
 *
 * Like the branding module, this runs when the admin imports widget files at
 * startup: it watches for a successful DELETE /auth/session and reloads into
 * the login page, which also drops the cached data of the logged-out user.
 */

// The dashboard is served under admin.path, which medusa-config leaves at its
// default.
const LOGIN_PATH = "/app/login"

const isLogoutRequest = (input: RequestInfo | URL, init?: RequestInit) => {
  const request = input instanceof Request ? input : null
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase()
  if (method !== "DELETE") {
    return false
  }

  const url = new URL(request?.url ?? input.toString(), window.location.href)
  return url.pathname.replace(/\/+$/, "").endsWith("/auth/session")
}

const installLogoutRedirect = () => {
  if (typeof window === "undefined" || (window as any).__equidentumLogoutRedirect) {
    return
  }
  ;(window as any).__equidentumLogoutRedirect = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init)

    if (response.ok && isLogoutRequest(input, init)) {
      window.location.assign(LOGIN_PATH)
    }

    return response
  }
}

installLogoutRedirect()

const LogoutRedirect = () => null

export const config = defineWidgetConfig({
  zone: "login.after",
})

export default LogoutRedirect

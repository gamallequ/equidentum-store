import { Cormorant_Garamond } from "next/font/google"
import "lenis/dist/lenis.css"

/**
 * The homepage has its own layout so the landing page can bring its own
 * transparent navigation and footer. Every other page keeps the store's
 * header and footer from the (main) layout.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className={display.variable}>{children}</div>
}

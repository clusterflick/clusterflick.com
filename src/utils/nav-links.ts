/** Navigation links shared across HeaderNav and MobileMenu. */
export const NAV_LINKS = [
  { href: "/near-me", label: "Near Me" },
  { href: "/venues", label: "Venues" },
  { href: "/festivals", label: "Festivals" },
  { href: "/film-clubs", label: "Film Clubs" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/about", label: "About" },
] as const;

/**
 * Sets the useBrowserBack flag in sessionStorage so the PageHeader back button
 * uses router.back() instead of navigating to the fixed backUrl. Call this
 * whenever navigating from the main nav to a sub-page.
 */
export function setUseBrowserBack() {
  try {
    sessionStorage.setItem("useBrowserBack", "true");
  } catch {
    // Ignore - UX optimisation only; sessionStorage may be unavailable
  }
}

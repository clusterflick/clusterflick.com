/**
 * Navigation links for the site.
 *
 * `NAV_LINKS` is the full list, shown in the hamburger menu (MobileMenu) at
 * every screen size. Links flagged `primary` are additionally surfaced as
 * quick-access links in the header (HeaderNav) on larger screens — see
 * `PRIMARY_NAV_LINKS`.
 */
interface NavLink {
  href: string;
  label: string;
  /** Surface this link inline in the header on tablet/desktop, not just the menu. */
  primary?: boolean;
}

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/films", label: "Films", primary: true },
  { href: "/formats", label: "Formats", primary: true },
  { href: "/genres", label: "Genres" },
  { href: "/venues", label: "Venues", primary: true },
  { href: "/london-cinemas", label: "London Cinemas" },
  { href: "/cinema-groups", label: "Cinema Groups" },
  { href: "/near-me", label: "Near Me" },
  { href: "/festivals", label: "Festivals", primary: true },
  { href: "/film-clubs", label: "Film Clubs", primary: true },
  { href: "/accessibility", label: "Accessibility", primary: true },
  { href: "/about", label: "About" },
  { href: "/changelog", label: "Changelog" },
];

/**
 * Subset of `NAV_LINKS` shown as inline quick links in the header on
 * tablet/desktop. The hamburger still exposes the full list.
 */
export const PRIMARY_NAV_LINKS = NAV_LINKS.filter((link) => link.primary);

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

/**
 * Navigation links for the site.
 *
 * `NAV_LINKS` is the full list, shown in the hamburger menu (MobileMenu) and the
 * site footer at every screen size. `PRIMARY_NAV_LINKS` is the much smaller
 * subset surfaced as inline quick links in the header (HeaderNav) on larger
 * screens.
 *
 * The two orders are deliberately independent. The menu and footer are grouped
 * by what a link is *about*, which is the useful order when you are scanning a
 * complete list. The header strip is ordered by how often a link is wanted,
 * because HeaderNav drops links from the end as the header runs out of room —
 * so its order decides what disappears first on a narrow desktop.
 */
export type NavGroupId = "discover" | "places" | "programmes" | "site";

interface NavLink {
  href: string;
  label: string;
  group: NavGroupId;
}

export const NAV_GROUPS: readonly { id: NavGroupId; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "places", label: "Places" },
  { id: "programmes", label: "Programmes" },
  { id: "site", label: "Site" },
];

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home", group: "discover" },
  { href: "/films", label: "Films", group: "discover" },
  { href: "/near-me", label: "Near Me", group: "discover" },
  { href: "/formats", label: "Formats", group: "discover" },
  { href: "/genres", label: "Genres", group: "discover" },
  { href: "/lists", label: "Film Lists", group: "discover" },
  // Named for what the pages actually contain — "Collections" was
  // indistinguishable from "Film Lists" as a bare nav label.
  { href: "/collections", label: "Franchises & Series", group: "discover" },
  // "Accessibility" alone reads as the site's own accessibility statement
  // rather than as screenings you can attend.
  {
    href: "/accessibility",
    label: "Accessible Screenings",
    group: "discover",
  },

  { href: "/venues", label: "Venues", group: "places" },
  { href: "/london-cinemas", label: "London Cinemas", group: "places" },
  { href: "/cinema-groups", label: "Cinema Groups", group: "places" },

  { href: "/festivals", label: "Festivals", group: "programmes" },
  { href: "/film-clubs", label: "Film Clubs", group: "programmes" },

  // "Updates" collided with the Changelog: this page is new listings, the
  // changelog is changes to the site itself.
  { href: "/updates", label: "New Listings", group: "site" },
  { href: "/about", label: "About", group: "site" },
  { href: "/changelog", label: "Changelog", group: "site" },
  { href: "/data-licence", label: "Data Licence", group: "site" },
];

/** `NAV_LINKS` bucketed into `NAV_GROUPS` order, for the menu and the footer. */
export const GROUPED_NAV_LINKS = NAV_GROUPS.map((group) => ({
  ...group,
  links: NAV_LINKS.filter((link) => link.group === group.id),
}));

/**
 * Hrefs shown as inline quick links in the header on tablet/desktop, in the
 * order they should survive truncation — HeaderNav renders as many as fit and
 * hides the rest, so entries at the end are the first to go. The hamburger
 * still exposes the full list.
 *
 * Home is omitted because the wordmark already links there, and the facet
 * indexes (formats, genres, lists) are reachable from the films grid's filters.
 */
const PRIMARY_NAV_HREFS: readonly string[] = [
  "/films",
  "/near-me",
  "/venues",
  "/festivals",
  "/film-clubs",
  "/accessibility",
];

export const PRIMARY_NAV_LINKS = PRIMARY_NAV_HREFS.map((href) => {
  const link = NAV_LINKS.find((navLink) => navLink.href === href);
  if (!link) throw new Error(`Unknown primary nav href: ${href}`);
  return link;
});

/**
 * Whether `href` is the nav entry for the page currently being viewed, so it can
 * be marked as current. Sub-pages count as their section (`/formats/70mm` is
 * still Formats), which is why this is a prefix match rather than equality.
 *
 * Home is the exception: every path is prefixed by "/", so it only ever matches
 * exactly.
 */
export function isCurrentNavPath(
  pathname: string | null,
  href: string,
): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

# Accessibility Audit — Clusterflick

**Date:** 2026-02-11
**Auditor:** Automated review of codebase + production site (clusterflick.com)
**Standards:** WCAG 2.1 AA

---

## What's Already Done Well

Before listing issues, it's worth noting that Clusterflick already has a solid accessibility foundation:

- `lang="en"` on `<html>` element (`src/app/layout.tsx:76`)
- `prefers-reduced-motion` respected globally (`src/app/globals.css:100-109`)
- `:focus-visible` styles with clear blue outline (`src/app/globals.css:88-97`)
- Chip component uses native `<input>` elements with `<label>` wrappers (`src/components/chip/index.tsx`)
- Expandable sections use `aria-expanded` and `aria-controls` properly (`src/components/expandable-section/index.tsx:27-28`)
- Mobile menu has `role="dialog"`, `aria-modal`, `aria-label`, and Escape key handler (`src/components/mobile-menu/index.tsx:49-52`)
- Filter trigger button has context-dependent `aria-label` (`src/components/filter-trigger/index.tsx:83-85`)
- Filter counts section uses `aria-live="polite"` with `aria-atomic="true"` (`src/components/filter-overlay/index.tsx:161`)
- Decorative elements marked with `aria-hidden="true"` in multiple components
- Date inputs have proper `<label htmlFor>` associations (`src/components/filter-overlay/date-filter-section.tsx:174-200`)

---

## Issues by Severity

### P0 — Critical (WCAG A violations, blocks access for some users)

#### 1. No `<main>` landmark wrapping page content

**WCAG:** 1.3.1 Info and Relationships (A), 2.4.1 Bypass Blocks (A)
**Files:** `src/components/page-wrapper/index.tsx:15`, `src/app/layout.tsx`
**Issue:** The `PageWrapper` component renders a `<div>`, and there is no `<main>` element anywhere in the page hierarchy. Screen reader users rely on landmarks to navigate; without `<main>`, there's no way to jump directly to primary content.
**Fix:** Change `PageWrapper` to render a `<main>` element (or add `role="main"`). Ensure only one `<main>` exists per page.

#### 2. No `<header>` landmark on main header

**WCAG:** 1.3.1 Info and Relationships (A)
**File:** `src/components/main-header/index.tsx:21`
**Issue:** The `MainHeader` renders as `<div className={styles.header}>`. Screen readers cannot identify this as the page header.
**Fix:** Change the outer `<div>` to `<header>`.

#### 3. Desktop navigation not wrapped in `<nav>`

**WCAG:** 1.3.1 Info and Relationships (A)
**File:** `src/components/header-nav/index.tsx:6`
**Issue:** The `HeaderNav` component renders links inside `<div className={styles.nav}>` instead of a semantic `<nav>` element. The mobile menu correctly uses `<nav aria-label="Main navigation">`, but the desktop version does not.
**Fix:** Change the `<div>` to `<nav aria-label="Main navigation">`.

#### 4. No skip navigation link

**WCAG:** 2.4.1 Bypass Blocks (A)
**File:** `src/app/layout.tsx`
**Issue:** There is no "Skip to main content" link at the top of the page. Keyboard users must tab through the header, filter trigger, and navigation on every page load before reaching content.
**Fix:** Add a visually-hidden skip link as the first focusable element in `<body>` that targets the `<main>` element.

#### 5. Search inputs missing accessible labels

**WCAG:** 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)
**Files:**

- `src/components/filter-overlay/index.tsx:213-221` — "Search event title..." input has `id` but no `<label>` or `aria-label`
- `src/components/filter-overlay/index.tsx:273-281` — "Search original venue title..." input, same issue
- `src/components/filter-overlay/venue-filter-section.tsx:195-201` — "Filter venues..." input has no `id`, `<label>`, or `aria-label`

**Issue:** All three search inputs rely on `placeholder` text as their only label. Placeholder text disappears on input and is not consistently announced by screen readers.
**Fix:** Add `aria-label` attributes to each input (e.g., `aria-label="Search event title"`, `aria-label="Search original venue title"`, `aria-label="Filter venues"`).

#### 6. Filter overlay not a dialog and lacks focus trap

**WCAG:** 2.4.3 Focus Order (A), 1.3.1 Info and Relationships (A)
**File:** `src/components/filter-overlay/index.tsx:152`
**Issue:** The filter overlay opens as a full-screen panel but is just a `<div>` — it has no `role="dialog"`, no `aria-modal`, and no focus trap. When open, keyboard users can tab to elements behind the overlay. The mobile menu correctly implements a dialog pattern, but the filter overlay does not.
**Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-label="Filter options"` to the overlay. Implement focus trapping (or use the `inert` attribute on background content). Return focus to the filter trigger button on close.

---

### P1 — High (WCAG A/AA violations, significant usability impact)

#### 7. Spinner/loading indicator not announced to screen readers

**WCAG:** 4.1.3 Status Messages (AA)
**Files:**

- `src/components/spinner/index.tsx:9` — renders a bare `<div>` with no ARIA attributes
- `src/components/loading-indicator/index.tsx:32-35` — wrapper div has no `role="status"` or `aria-live`

**Issue:** When content is loading, screen reader users get no indication. The visual spinner is invisible to assistive technology.
**Fix:** Add `role="status"` and `aria-live="polite"` to the `LoadingIndicator` wrapper. Add `aria-label="Loading"` to the `Spinner` div, or make it `aria-hidden="true"` when used inside `LoadingIndicator` (which has the text).

#### 8. "Copied!" feedback not announced

**WCAG:** 4.1.3 Status Messages (AA)
**File:** `src/components/filter-overlay/index.tsx:137-146`
**Issue:** When "Share Filters" is clicked and the URL is copied, the button text changes to "Copied!" — but this is a visual-only change. No `aria-live` region announces the success.
**Fix:** Wrap the button text area in an `aria-live="assertive"` region, or use the existing `aria-live="polite"` counts section pattern.

#### 9. Social media links missing accessible names

**WCAG:** 2.4.4 Link Purpose (A), 1.1.1 Non-text Content (A)
**Files:**

- `src/app/about/page.tsx:78-85` — social `LinkCard` components
- `src/components/link-card/index.tsx:21-28` — `<a>` element accepts no `aria-label` prop

**Issue:** Social links render as `<a>` with an SVG icon + handle text. While the handle text provides _some_ context, the `LinkCard` component doesn't support `aria-label`, so links like the email one announce with less clarity. More critically, the SVG icons have no `aria-hidden="true"`, so screen readers may attempt to describe them.
**Fix:** Add `aria-label` prop support to `LinkCard`. Mark social media SVG icons with `aria-hidden="true"` in the icon components. Use `aria-label` like `"Clusterflick on Instagram"` for each social link.

#### 10. Mobile menu focus not restored on close

**WCAG:** 2.4.3 Focus Order (A)
**File:** `src/components/mobile-menu/index.tsx:24-25`
**Issue:** When the mobile menu is closed via Escape key or the close button, focus is not returned to the menu trigger button. Focus gets lost, which is disorienting for keyboard/screen reader users.
**Fix:** Store a ref to the menu button and call `.focus()` on it when the menu closes.

#### 11. Header logo button has a vague accessible name

**WCAG:** 2.4.4 Link Purpose (A)
**File:** `src/components/header-logo/index.tsx:20`
**Issue:** The button's accessible name is derived from its content: the image alt ("Clusterflick") and the text "Clusterflick". But the button's _action_ is to reset filters and scroll to top — not navigation to a homepage. Users expect a logo to be a link to home, not a button with a side effect.
**Fix:** Add `aria-label="Clusterflick — reset filters and return to top"` to the button.

---

### P2 — Medium (WCAG AA issues, moderate impact)

#### 12. Color contrast: `--color-muted-gray` (#888888) on dark backgrounds

**WCAG:** 1.4.3 Contrast (Minimum) (AA)
**File:** `src/app/globals.css:11`
**Used in:**

- `src/components/filter-overlay/filter-overlay.module.css` (section descriptions, date labels, geo error text)
- `src/components/expandable-section/expandable-section.module.css` (trigger text)
- `src/components/chip/chip.module.css` (count text)

**Issue:** `#888888` on `#010013` (midnight navy) gives a contrast ratio of approximately 5.3:1, which passes AA for normal text (4.5:1). However, at small font sizes (11px used for date labels, chip counts), some of this text may be _effectively_ hard to read. The expandable section trigger text at `#888888` on darker overlay backgrounds may also be borderline.
**Recommendation:** Increase to `#999999` or `#9a9a9a` for more comfortable readability, especially for small text.

#### 13. Venue group "Select All"/"Clear All" buttons missing `aria-label`

**WCAG:** 2.4.4 Link Purpose (A)
**File:** `src/components/filter-overlay/venue-filter-section.tsx:286-301`
**Issue:** Within each venue group, the "Select All" and "Clear All" buttons have no `aria-label` indicating _which group_ they apply to. Multiple identical "Select All" buttons on one page are confusing for screen reader users.
**Fix:** Add `aria-label={`Select all ${group.label} venues`}` to each button.

#### 14. Genre filter "Select All"/"Clear All" missing `aria-label`

**WCAG:** 2.4.4 Link Purpose (A)
**File:** `src/components/filter-overlay/category-filter-section.tsx:170-184`
**Issue:** Same as above — the genre section's Select All / Clear All buttons have no distinguishing label.
**Fix:** Add `aria-label="Select all genres"` and `aria-label="Clear all genres"`.

#### 15. About page has no `<main>` landmark

**WCAG:** 1.3.1 Info and Relationships (A)
**File:** `src/app/about/page.tsx:30`
**Issue:** The about page wraps its content in a bare `<div>` instead of `<main>`.
**Fix:** Change the outer `<div>` to `<main>`.

#### 16. SVG icons missing `aria-hidden="true"` when decorative

**WCAG:** 1.1.1 Non-text Content (A)
**File:** `src/components/icons/index.tsx`
**Issue:** The icon components (`ArrowLeftIcon`, `ChevronDownIcon`, `CloseIcon`, `PlayIcon`, `EmailIcon`, `MenuIcon`, and all social icons) don't set `aria-hidden="true"` by default. When these icons are used alongside text (e.g., inside buttons with `aria-label`), the SVG is announced redundantly or confusingly.
**Fix:** Add `aria-hidden="true"` as a default prop on all icon SVGs that get spread via `...props` (so callers can override when needed).

#### 17. Geolocation error message not announced

**WCAG:** 4.1.3 Status Messages (AA)
**File:** `src/components/filter-overlay/venue-filter-section.tsx:173`
**Issue:** The geo error message (`<p className={styles.geoError}>{geoError}</p>`) appears dynamically but has no `role="alert"` or `aria-live` attribute.
**Fix:** Add `role="alert"` to the error paragraph.

---

### P3 — Low (Best practices, enhancements)

#### 18. Hero section background image defaults to empty alt

**File:** `src/components/hero-section/index.tsx:42`
**Issue:** `backgroundImageAlt` defaults to `""`. While an empty alt on a decorative background is technically correct (treating it as decorative), callers should be encouraged to provide alt text when the image adds meaningful context. The about page correctly passes `backgroundImageAlt="Rows of cinema seats"`, but the default could lead to mistakes.
**Recommendation:** No code change needed, but consider adding a JSDoc note encouraging callers to set alt text for meaningful images.

#### 19. Movie cell link has no accessible description beyond the image alt

**File:** `src/components/movie-cell/index.tsx:34-61`
**Issue:** The link wraps a poster image. The accessible name comes from the poster's alt text (the movie title), which is adequate. However, for multi-movie events, the link purpose could be clearer.
**Recommendation:** Consider adding `aria-label={movie.title}` to the link for consistency.

#### 20. Expandable section uses `hidden` attribute

**File:** `src/components/expandable-section/index.tsx:55`
**Issue:** The `hidden` attribute completely removes content from the accessibility tree when collapsed. This is actually _correct_ behavior for a disclosure widget — screen readers should not access hidden content. No fix needed, just confirming this is intentional.

#### 21. External links missing indication they open in new tab

**WCAG:** 3.2.5 Change on Request (AAA)
**Files:** `src/components/link-card/index.tsx:23`, `src/app/about/page.tsx` (various external links)
**Issue:** Links with `target="_blank"` don't indicate they open a new window/tab. While this is a AAA criterion, it's good practice.
**Recommendation:** Add `aria-label` suffix like "(opens in new tab)" or a visually-hidden text indicator.

---

## Fix Plan (Ordered by Priority)

| #     | Issue                                          | Priority | Effort | Files to Change                                            |
| ----- | ---------------------------------------------- | -------- | ------ | ---------------------------------------------------------- |
| 1     | Add `<main>` landmark                          | P0       | Low    | `page-wrapper/index.tsx`, `about/page.tsx`                 |
| 2     | Add `<header>` landmark                        | P0       | Low    | `main-header/index.tsx`                                    |
| 3     | Add `<nav>` to desktop navigation              | P0       | Low    | `header-nav/index.tsx`                                     |
| 4     | Add skip navigation link                       | P0       | Low    | `layout.tsx`, `globals.css`                                |
| 5     | Add `aria-label` to search inputs              | P0       | Low    | `filter-overlay/index.tsx`, `venue-filter-section.tsx`     |
| 6     | Add dialog role + focus trap to filter overlay | P0       | Medium | `filter-overlay/index.tsx`                                 |
| 7     | Add `role="status"` to loading indicator       | P1       | Low    | `loading-indicator/index.tsx`, `spinner/index.tsx`         |
| 8     | Announce "Copied!" to screen readers           | P1       | Low    | `filter-overlay/index.tsx`                                 |
| 9     | Add accessible names to social links           | P1       | Low    | `link-card/index.tsx`, `about/page.tsx`, `icons/index.tsx` |
| 10    | Restore focus on mobile menu close             | P1       | Low    | `mobile-menu/index.tsx`                                    |
| 11    | Improve header logo button label               | P1       | Low    | `header-logo/index.tsx`                                    |
| 12    | Review muted gray contrast                     | P2       | Low    | `globals.css`                                              |
| 13    | Add `aria-label` to venue group buttons        | P2       | Low    | `venue-filter-section.tsx`                                 |
| 14    | Add `aria-label` to genre filter buttons       | P2       | Low    | `category-filter-section.tsx`                              |
| 15    | Add `<main>` to about page                     | P2       | Low    | `about/page.tsx`                                           |
| 16    | Add `aria-hidden` to decorative SVG icons      | P2       | Low    | `icons/index.tsx`                                          |
| 17    | Announce geolocation error                     | P2       | Low    | `venue-filter-section.tsx`                                 |
| 18-21 | Low-priority enhancements                      | P3       | Low    | Various                                                    |

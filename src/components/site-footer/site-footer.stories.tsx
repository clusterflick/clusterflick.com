import type { Meta, StoryObj } from "@storybook/react";
import SiteFooter from "@/components/site-footer";

/**
 * `SiteFooter` is the site-wide footer: every navigable page, grouped exactly
 * as the hamburger menu groups them, plus a one-line colophon.
 *
 * It takes no props — the link list comes from `GROUPED_NAV_LINKS` in
 * `@/utils/nav-links`, the single source shared with `MobileMenu` and
 * `HeaderNav`, so adding a page to the nav adds it here too.
 *
 * **When to use:**
 * - At the bottom of any ordinary content page. `StandardPageLayout` already
 *   renders it, so pages using that layout get it for free.
 *
 * **When NOT to use:**
 * - On virtualised full-height scroll surfaces — the films grid and the movie
 *   detail showings list — where content below the scroller is unreachable in
 *   practice and fights the virtualiser's height calculations.
 */
const meta = {
  title: "Components/SiteFooter",
  component: SiteFooter,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The footer as it appears on every page that renders it. */
export const Default: Story = {};

/**
 * At narrow widths the group columns collapse to a single stack, so the footer
 * reads as four labelled sections rather than a wrapped grid.
 */
export const Narrow: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import DetailPageHero from "@/components/detail-page-hero";
import Tag from "@/components/tag";

/**
 * `DetailPageHero` is the standard hero for venue and festival detail pages. It
 * renders an `OutlineHeading` title, an optional logo image, an optional URL
 * link, a status card showing film/showing counts, and a `children` slot for
 * extra content (e.g. social links or a tag row).
 *
 * **When to use:**
 * - Venue detail pages.
 * - Festival detail pages.
 *
 * **When NOT to use:**
 * - Movie detail pages use a custom hero (poster + metadata) — do not use this
 *   component there.
 * - For a generic hero banner — use `HeroSection` directly.
 */
const meta = {
  title: "Components/DetailPageHero",
  component: DetailPageHero,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DetailPageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active venue with film and showing counts. */
export const WithEvents: Story = {
  args: {
    name: "BFI Southbank",
    url: "https://www.bfi.org.uk/bfi-southbank",
    movieCount: 24,
    performanceCount: 87,
  },
};

/** Venue with no upcoming screenings — shows "No showings currently listed". */
export const NoEvents: Story = {
  args: {
    name: "Electric Cinema",
    url: "https://www.electriccinema.co.uk",
    movieCount: 0,
    performanceCount: 0,
  },
};

/**
 * A dormant venue, dated by the venue registry. The date is what makes the
 * difference between "nothing on this week" and "nothing on since the spring"
 * legible, which a bare status line cannot say.
 */
export const NoEventsWithLastScreening: Story = {
  args: {
    name: "Electric Cinema",
    url: "https://www.electriccinema.co.uk",
    movieCount: 0,
    performanceCount: 0,
    lastPerformance: new Date("2026-03-14T20:30:00Z").getTime(),
  },
};

/**
 * A venue with nothing listed whose last known performance is still ahead of
 * it - possible when its listings hold something the site does not show as a
 * film. The date is suppressed rather than dating the silence to the future.
 */
export const NoEventsWithFuturePerformance: Story = {
  args: {
    name: "Electric Cinema",
    url: "https://www.electriccinema.co.uk",
    movieCount: 0,
    performanceCount: 0,
    lastPerformance: new Date("2099-01-01T20:30:00Z").getTime(),
  },
};

/** Hero with a children slot — used for a tag or social link row below the URL. */
export const WithChildren: Story = {
  args: {
    name: "Barbican Cinema",
    url: "https://www.barbican.org.uk",
    movieCount: 18,
    performanceCount: 52,
    children: (
      <div style={{ marginTop: 12 }}>
        <Tag color="blue">Independent</Tag>
      </div>
    ),
  },
};

/** Venue with no URL — the link row is omitted. */
export const NoUrl: Story = {
  args: {
    name: "Prince Charles Cinema",
    movieCount: 12,
    performanceCount: 34,
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import VenueCard from "@/components/venue-card";

/**
 * `VenueCard` is a horizontal navigation card for a single venue. It shows a
 * logo (or initial-letter fallback), the name, a type tag, and an optional
 * stats line combining a leading `detail` string with film/showing counts.
 *
 * It wraps `NavCard` and inherits the standard lift-and-glow hover animation.
 *
 * **When to use:**
 * - Venue listings on the home page and London Cinemas page where cards are
 *   arranged in a `CardGrid`.
 * - Any single-line entity link that wants the same horizontal card — the movie
 *   page's "Screening as part of" festival card uses it with `detail` set to
 *   the festival's date range.
 *
 * **When NOT to use:**
 * - For plain link lists of venues — use `LinkGrid` instead.
 * - For festival/film-club *listing* pages — use `EventCard`, which has room
 *   for a description.
 */
const meta = {
  title: "Components/VenueCard",
  component: VenueCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof VenueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Card with film and showing counts — typical state when the venue is active. */
export const WithCounts: Story = {
  args: {
    href: "/venues/bfi-southbank",
    name: "BFI Southbank",
    type: "Cinema",
    imagePath: null,
    filmCount: 24,
    performanceCount: 87,
  },
};

/** Card without counts — shown when the venue has no upcoming screenings. */
export const WithoutCounts: Story = {
  args: {
    href: "/venues/rio-cinema",
    name: "Rio Cinema",
    type: "Cinema",
    imagePath: null,
  },
};

/** Card with a leading detail on the stats line — used for festival date ranges. */
export const WithDetail: Story = {
  args: {
    href: "/festivals/kinoteka",
    name: "Kinoteka Polish Film Festival",
    type: "Festival",
    imagePath: null,
    detail: "24 Feb – 5 Mar",
    filmCount: 18,
    performanceCount: 42,
  },
};

/** Card using the initial-letter fallback when no logo image is available. */
export const InitialFallback: Story = {
  args: {
    href: "/venues/electric-cinema",
    name: "Electric Cinema",
    type: "Cinema",
    imagePath: null,
    filmCount: 8,
    performanceCount: 19,
  },
};

/** Multiple cards in a grid — shows consistent layout across a card set. */
export const CardGridExample: Story = {
  args: { href: "#", name: "BFI Southbank", type: "Cinema", imagePath: null },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12,
      }}
    >
      {[
        { name: "BFI Southbank", type: "Cinema", films: 24, showings: 87 },
        { name: "Barbican Cinema", type: "Cinema", films: 18, showings: 52 },
        {
          name: "Prince Charles Cinema",
          type: "Cinema",
          films: 12,
          showings: 34,
        },
        { name: "Rio Cinema", type: "Cinema", films: 0, showings: 0 },
      ].map((v) => (
        <VenueCard
          key={v.name}
          href={`/venues/${v.name.toLowerCase().replace(/\s+/g, "-")}`}
          name={v.name}
          type={v.type}
          imagePath={null}
          filmCount={v.films}
          performanceCount={v.showings}
        />
      ))}
    </div>
  ),
};

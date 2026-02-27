import type { Meta, StoryObj } from "@storybook/react";
import VenueCard from "@/components/venue-card";

/**
 * `VenueCard` is a navigation card for a single venue. It shows a logo (or
 * initial-letter fallback), the venue name, a type tag, and an optional
 * film/showing count.
 *
 * It wraps `NavCard` and inherits the standard lift-and-glow hover animation.
 *
 * **When to use:**
 * - Venue listings on the home page and London Cinemas page where cards are
 *   arranged in a `CardGrid`.
 *
 * **When NOT to use:**
 * - For plain link lists of venues — use `LinkGrid` instead.
 * - For non-venue entities (festivals, boroughs) — use `NavCard` directly with
 *   custom interior layout.
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

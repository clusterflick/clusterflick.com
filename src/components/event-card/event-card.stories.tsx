import type { Meta, StoryObj } from "@storybook/react";
import EventCard from "@/components/event-card";

/**
 * `EventCard` is a clickable card for curated film programmes — festivals,
 * film clubs, and similar named entities. It provides a centred logo with
 * placeholder fallback, a two-line-clamped name, a three-line-clamped
 * description, and a flexible `meta` slot for the caller to supply
 * domain-specific information such as dates or film counts.
 *
 * **When to use:**
 * - Listing pages for festivals, film clubs, or any curated film programme.
 *
 * **When NOT to use:**
 * - Venue listings — use `VenueCard` instead.
 * - Movie posters — use `FilmPosterGrid`.
 * - External links — use `LinkCard`.
 */
const meta = {
  title: "Components/EventCard",
  component: EventCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const filmCountMeta = (
  <span
    style={{
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-electric-blue)",
      background: "rgba(49, 158, 219, 0.12)",
      padding: "2px 10px",
      borderRadius: 20,
    }}
  >
    12 films
  </span>
);

const noFilmsMeta = (
  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
    No films currently showing
  </span>
);

/** Card with a logo image, description, and film count badge. */
export const WithLogo: Story = {
  args: {
    href: "/festivals/bfi-flare",
    name: "BFI Flare",
    imagePath: null,
    description: "the UK's longest-running LGBTQIA+ film festival",
    meta: filmCountMeta,
  },
};

/** Card with no image — shows the placeholder logo. */
export const WithoutLogo: Story = {
  args: {
    href: "/film-clubs/ghibliotheque",
    name: "Ghibliotheque",
    imagePath: null,
    description: "a celebration of Studio Ghibli and the films of Hayao Miyazaki",
    meta: filmCountMeta,
  },
};

/** Card for a club with no current screenings — caller passes the "no films" message as meta. */
export const NoFilms: Story = {
  args: {
    href: "/film-clubs/lost-reels",
    name: "Lost Reels",
    imagePath: null,
    description: "rare, forgotten, and overlooked films brought back to the big screen",
    meta: noFilmsMeta,
  },
};

/** Grid of cards showing consistent hover behaviour across multiple items. */
export const Grid: Story = {
  args: {
    href: "#",
    name: "",
    imagePath: null,
    description: null,
    meta: null,
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {[
        { href: "/festivals/bfi-flare", name: "BFI Flare", description: "the UK's longest-running LGBTQIA+ film festival", meta: filmCountMeta },
        { href: "/film-clubs/ghibliotheque", name: "Ghibliotheque", description: "a celebration of Studio Ghibli and the films of Hayao Miyazaki", meta: filmCountMeta },
        { href: "/film-clubs/lost-reels", name: "Lost Reels", description: "rare, forgotten, and overlooked films brought back to the big screen", meta: noFilmsMeta },
      ].map((item) => (
        <EventCard key={item.href} {...item} imagePath={null} />
      ))}
    </div>
  ),
};

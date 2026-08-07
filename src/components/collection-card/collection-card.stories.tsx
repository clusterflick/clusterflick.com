import type { Meta, StoryObj } from "@storybook/react";
import CollectionCard from "@/components/collection-card";

/**
 * `CollectionCard` is a clickable card for a film collection — a franchise or
 * series such as Harry Potter or Alien. It shows the collection's poster and
 * how many of its films are currently screening.
 *
 * **When to use:**
 * - Listing pages for collections.
 *
 * **When NOT to use:**
 * - Festivals and film clubs — use `EventCard`, which is built around a logo.
 * - Individual films — use `FilmPosterGrid`.
 */
const meta = {
  title: "Components/CollectionCard",
  component: CollectionCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CollectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showing: Story = {
  args: {
    id: "1241",
    name: "Harry Potter",
    href: "/collections/harry-potter",
    posterPath: "/eVPs2Y0LyvTLZn6AP5Z6O2rtiGB.jpg",
    showingCount: 3,
    partCount: 8,
  },
};

/** A single film from the collection is playing — the common case. */
export const OneShowing: Story = {
  args: {
    ...Showing.args,
    name: "The Lord of the Rings",
    href: "/collections/the-lord-of-the-rings",
    posterPath: "/pC4hnFrDqYVJTgOoJ2vCVvyWTHF.jpg",
    showingCount: 1,
    partCount: 3,
  },
};

/** Nothing from the collection is currently booked in. */
export const NothingShowing: Story = {
  args: {
    ...Showing.args,
    showingCount: 0,
  },
};

/**
 * TMDB has no poster for the collection, so `MoviePoster` falls back to its
 * generated text pattern.
 */
export const WithoutPoster: Story = {
  args: {
    ...Showing.args,
    posterPath: undefined,
  },
};

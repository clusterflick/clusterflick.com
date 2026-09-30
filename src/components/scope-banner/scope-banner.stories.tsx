import type { Meta, StoryObj } from "@storybook/react";
import ScopeBanner from "@/components/scope-banner";

/**
 * `ScopeBanner` names what a grid has been narrowed *to* — a film club's or
 * festival's programme — above the grid, each with a link to its page and a
 * button to take it off.
 *
 * **When to use:** a filter that changes what the page is rather than how
 * narrow it is, and so shouldn't be visible only inside the filter overlay.
 * The catalogue and planner use it for the film club and festival filters.
 *
 * **When NOT to use:** ordinary narrowing (dates, venues, genres), which the
 * filter trigger's description already reports; or anything without a page of
 * its own to link to.
 */
const meta = {
  title: "Components/ScopeBanner",
  component: ScopeBanner,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScopeBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One film club, as a club page's "Explore" link leaves it. */
export const FilmClub: Story = {
  args: {
    items: [
      {
        id: "japanese-film-club",
        kind: "Film club",
        name: "Japanese Film Club",
        href: "/film-clubs/japanese-film-club",
        onRemove: () => {},
      },
    ],
  },
};

/** A club and a festival together, with a festival name long enough to truncate. */
export const ClubAndFestival: Story = {
  args: {
    items: [
      {
        id: "japanese-film-club",
        kind: "Film club",
        name: "Japanese Film Club",
        href: "/film-clubs/japanese-film-club",
        onRemove: () => {},
      },
      {
        id: "bfi-flare",
        kind: "Festival",
        name: "BFI Flare: London LGBTQIA+ Film Festival",
        href: "/festivals/bfi-flare",
        onRemove: () => {},
      },
    ],
  },
};

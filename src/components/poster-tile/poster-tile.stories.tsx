import type { Meta, StoryObj } from "@storybook/react";
import Button from "@/components/button";
import PosterTile, { PosterTileList } from ".";

/**
 * `PosterTile` is a compact poster with its title and a line or two of detail
 * underneath. The whole tile is one link; an optional `action` sits below it,
 * outside the link. Place tiles in a `PosterTileList`, which lays them out six
 * across a 960px column and two across a phone.
 *
 * **When to use:** dense sets of films where the title has to be readable at
 * a glance — the new films in an update, a reader's watchlist — or where a
 * control has to sit with each film.
 *
 * **When NOT to use:** browsing grids of full-size posters, where the title
 * shows on hover — use `FilmPosterGrid`.
 */
const meta = {
  title: "Components/PosterTile",
  component: PosterTile,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <PosterTileList>
        <Story />
      </PosterTileList>
    ),
  ],
} satisfies Meta<typeof PosterTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A linked film with a venue and a count, as on the updates page. */
export const Linked: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
    href: "/movies/28/apocalypse-now",
    details: ["Prince Charles Cinema", "3 showings"],
  },
};

/** A double bill, drawn as a stack of its films' posters. */
export const Event: Story = {
  args: {
    title: "Alien + Aliens",
    href: "/movies/1/alien-aliens",
    includedMovies: [
      { title: "Alien", posterPath: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" },
      { title: "Aliens", posterPath: "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg" },
    ],
    details: ["2 venues", "4 showings"],
  },
};

/** With a control under the text, as on a reader's watchlist. */
export const WithAction: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
    href: "/movies/28/apocalypse-now",
    details: ["1979"],
    action: <Button variant="link">Remove</Button>,
  },
};

/** Unlinked — a film no longer showing, with nowhere to lead. */
export const Unlinked: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
    details: ["1979"],
    action: <Button variant="link">Remove</Button>,
  },
};

/** With a note above the control — what makes the film time-sensitive. */
export const WithNote: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
    href: "/movies/28/apocalypse-now",
    details: ["1979"],
    note: {
      label: "Live score by the Hugo Max Quartet",
      detail: "Sat 3 Oct, 18:30 · BFI Southbank",
    },
    action: <Button variant="link">Remove</Button>,
  },
};

/** A yellow note, for a last chance — the planner's "Last chance" colour. */
export const WithLastChanceNote: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
    href: "/movies/28/apocalypse-now",
    details: ["1979"],
    note: {
      label: "Final showing",
      detail: "Tomorrow, 20:30 · Prince Charles Cinema",
      color: "yellow",
    },
    action: <Button variant="link">Remove</Button>,
  },
};

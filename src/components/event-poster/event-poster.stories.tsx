import type { Meta, StoryObj } from "@storybook/react";
import EventPoster from ".";

/**
 * `EventPoster` picks the right poster for a film or event: a stack for a
 * double bill or marathon with posters to fan out, otherwise a single poster —
 * the event's own, or its first included film's.
 *
 * **When to use:** anywhere a film *or event* is shown by its poster — the
 * films grid, the listing page, the updates feed, the planner. It keeps the
 * stacking rule in one place.
 *
 * **When NOT to use:** a poster that is only ever a single film (a TMDB
 * collection part, say) — use `MoviePoster` directly.
 */
const meta = {
  title: "Components/EventPoster",
  component: EventPoster,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventPoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single film: a plain poster. */
export const SingleFilm: Story = {
  args: {
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
  },
};

/** A double bill with posters for both films: stacked. */
export const DoubleBill: Story = {
  args: {
    title: "Alien + Aliens",
    includedMovies: [
      { title: "Alien", posterPath: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" },
      { title: "Aliens", posterPath: "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg" },
    ],
  },
};

/**
 * An event with no poster of its own and only one included film with one: a
 * single poster, borrowed from that film.
 */
export const BorrowedPoster: Story = {
  args: {
    title: "Mystery Double Bill",
    includedMovies: [
      { title: "Alien", posterPath: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" },
      { title: "Unknown" },
    ],
  },
};

/** The planner's thumbnail: a stack at 48px, without the hover fan-out. */
export const Thumbnail: Story = {
  args: {
    ...DoubleBill.args,
    size: "xsmall",
    interactive: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 48 }}>
        <Story />
      </div>
    ),
  ],
};

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import PosterTile, { PosterTileList, RemovedPosterTile } from ".";

/**
 * `RemovedPosterTile` holds the place of a `PosterTile` that has just been
 * removed, with an **Undo** where the tile's own control was and a countdown
 * along the foot of the empty poster. The countdown pauses on hover and on
 * keyboard focus; when it runs out, `onExpire` fires and the caller drops it.
 *
 * **When to use:** after removing a film from a reader's list, in the same
 * `PosterTileList` position the film held.
 *
 * **When NOT to use:** anywhere nothing was removed — it is a placeholder, not
 * an empty state (use `EmptyState`).
 */
const meta = {
  title: "Components/PosterTile/Removed",
  component: RemovedPosterTile,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: {
    title: "Apocalypse Now",
    message: "Removed from Watchlist",
    onUndo: fn(),
    onExpire: fn(),
  },
  decorators: [
    (Story) => (
      <PosterTileList>
        <PosterTile
          title="Alien"
          posterPath="/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg"
          details={["1979"]}
        />
        <Story />
        <PosterTile
          title="Aliens"
          posterPath="/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg"
          details={["1986"]}
        />
      </PosterTileList>
    ),
  ],
} satisfies Meta<typeof RemovedPosterTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Between two tiles, as it sits in a list. */
export const Default: Story = {};

/**
 * A long countdown, so the draining bar can be looked at. (Visual tests
 * capture the first frame either way.)
 */
export const LongCountdown: Story = {
  args: { duration: 60_000 },
};

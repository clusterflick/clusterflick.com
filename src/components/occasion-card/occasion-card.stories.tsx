import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import PosterScroller from "@/components/poster-row/scroller";
import OccasionCard, { RemovedOccasionCard } from ".";

/**
 * `OccasionCard` is a wide card that leads with why a showing is worth
 * catching — a guest, a live score, the last night of a run — in large type,
 * with the day above it and the film and venue beneath. The poster sits beside
 * it and is blurred behind the card as a wash.
 *
 * **When to use:** in a horizontal row where one showing is the reason to go:
 * the home page's More Than a Screening (through `OccasionRow`), and the
 * watchlist's Don't miss on `/personalise`, where it replaced poster tiles that
 * wrapped onto row after row.
 *
 * **When NOT to use:** where the film is the point — use `PosterRow` or
 * `PosterTile`; a short grid of picks each with a reason label — use
 * `PickCard`.
 */
const meta = {
  title: "Components/OccasionCard",
  component: OccasionCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: {
    id: "11645",
    href: "/movies/11645/ran",
    title: "Ran",
    posterPath: "/dGgiXMWDcS5aJTBEFu7bmaQPNox.jpg",
    lead: "With an introduction",
    when: "Sun 8 Nov, 19:30",
    venue: "The Chiswick Cinema",
  },
} satisfies Meta<typeof OccasionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An occasion, in the pink. */
export const Occasion: Story = {};

/** A final screening, in the planner's "Last chance" yellow. */
export const FinalScreening: Story = {
  args: {
    lead: "Final screening",
    when: "Tomorrow, 20:30",
    tone: "yellow",
  },
};

/** A long lead is clamped to three lines; a film without a poster keeps its place. */
export const LongLeadNoPoster: Story = {
  args: {
    id: "silent",
    href: "/movies/silent/the-lodger",
    title: "The Lodger",
    posterPath: undefined,
    lead: "In conversation with the director and the editor, followed by a panel on the archive",
    venue: "Cinema Museum",
  },
};

/** A double bill draws its films' posters as a stack, and its wash from the first. */
export const DoubleBill: Story = {
  args: {
    id: "double-bill",
    href: "/movies/double-bill/alien-aliens",
    title: "Alien + Aliens",
    posterPath: undefined,
    includedMovies: [
      { title: "Alien", posterPath: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" },
      { title: "Aliens", posterPath: "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg" },
    ],
    lead: "Final screening",
    when: "Fri 13 Nov, 18:00",
    tone: "yellow",
    venue: "Prince Charles Cinema",
  },
};

/** With the watchlist's editing buttons, which sit under the link. */
export const WithAction: Story = {
  args: {
    showMarkers: false,
    action: (
      <button type="button" onClick={fn()}>
        Remove
      </button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link");
    const button = canvas.getByRole("button", { name: "Remove" });
    await expect(link).not.toContainElement(button);
  },
};

/** The watchlist's Don't miss: both kinds in one scrolling row, soonest first. */
export const InARow: Story = {
  render: (args) => (
    <PosterScroller bleed={false}>
      <OccasionCard
        {...args}
        lead="Final screening"
        when="Tomorrow, 20:30"
        tone="yellow"
      />
      <OccasionCard
        {...args}
        id="309"
        href="/movies/309/the-celebration"
        title="The Celebration"
        posterPath="/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg"
        lead="Q&A with the director"
        when="Wed 4 Nov, 19:30"
        venue="The Cinema Museum"
      />
      <RemovedOccasionCard
        title="Coup 53"
        message="Removed from Watchlist"
        duration={60_000}
        onUndo={fn()}
        onExpire={fn()}
      />
    </PosterScroller>
  ),
};

const onUndo = fn();

/** The space a removed card leaves, with Undo where its buttons were. */
export const Removed: Story = {
  render: () => (
    <RemovedOccasionCard
      title="Ran"
      message="Moved to Seen"
      duration={60_000}
      onUndo={onUndo}
      onExpire={fn()}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Undo: moved to seen — Ran" }),
    );
    await expect(onUndo).toHaveBeenCalledOnce();
  },
};

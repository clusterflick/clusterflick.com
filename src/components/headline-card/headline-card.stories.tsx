import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import PosterScroller from "@/components/poster-row/scroller";
import HeadlineCard, { RemovedHeadlineCard } from ".";

/**
 * `HeadlineCard` is a wide card that leads with one fact about a film in large
 * type — a guest, a live score, the last night of a run, a record — with a
 * small line above it and the film and a detail beneath. The poster sits
 * beside it and is blurred behind the card as a wash.
 *
 * **When to use:** where one fact about a film is the point: the home page's
 * More Than a Screening (through `OccasionRow`), the watchlist's Don't miss on
 * `/personalise` (in a `CardDeck`), and the Seen records.
 *
 * **When NOT to use:** where the film is the point — use `PosterRow` or
 * `PosterTile`; a short grid of picks each with a reason label — use
 * `PickCard`.
 */
const meta = {
  title: "Components/HeadlineCard",
  component: HeadlineCard,
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
    eyebrow: "Sun 8 Nov, 19:30",
    detail: "The Chiswick Cinema",
  },
} satisfies Meta<typeof HeadlineCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An occasion, in the pink. */
export const Occasion: Story = {};

/** A final screening, in the planner's "Last chance" yellow. */
export const FinalScreening: Story = {
  args: {
    lead: "Final screening",
    eyebrow: "Tomorrow, 20:30",
    tone: "yellow",
  },
};

/** A record: gray, since there's nothing to book, and unlinked for a film no longer showing. */
export const Record: Story = {
  args: {
    href: undefined,
    lead: "2h 42m",
    eyebrow: "Longest sit",
    detail: "1985",
    tone: "gray",
    showMarkers: false,
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
    detail: "Cinema Museum",
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
    eyebrow: "Fri 13 Nov, 18:00",
    tone: "yellow",
    detail: "Prince Charles Cinema",
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
      <HeadlineCard
        {...args}
        lead="Final screening"
        eyebrow="Tomorrow, 20:30"
        tone="yellow"
      />
      <HeadlineCard
        {...args}
        id="309"
        href="/movies/309/the-celebration"
        title="The Celebration"
        posterPath="/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg"
        lead="Q&A with the director"
        eyebrow="Wed 4 Nov, 19:30"
        detail="The Cinema Museum"
      />
      <RemovedHeadlineCard
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
    <RemovedHeadlineCard
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

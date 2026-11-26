import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import HeadlineCard from "@/components/headline-card";
import VenueCard from "@/components/venue-card";
import CardDeck from ".";

/**
 * `CardDeck` is a grid of cards that shows its first rows in full and tucks
 * the next row under them as the top of a deck, fading out, with "Show N more"
 * over it. Every card drawn in full can be read whole, and the deck says how
 * much more there is without a horizontal scroll.
 *
 * **When to use:** a list of cards that grows long, mostly on a phone, where
 * the first few are what most readers want: the watchlist's Don't miss, My
 * Venues, a reader's progress through the film lists.
 *
 * **When NOT to use:** posters — use `PosterStack`; a short list whose every
 * item matters equally — a plain grid.
 */
const meta = {
  title: "Components/CardDeck",
  component: CardDeck,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CardDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

const FILMS = [
  {
    id: "11645",
    title: "Ran",
    posterPath: "/dGgiXMWDcS5aJTBEFu7bmaQPNox.jpg",
  },
  {
    id: "309",
    title: "The Celebration",
    posterPath: "/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg",
  },
  {
    id: "28",
    title: "Apocalypse Now",
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
  },
];

/** Nine cards, three films repeated: enough for two open rows and a deck. */
const headlineCards = Array.from({ length: 9 }, (_, index) => {
  const film = FILMS[index % FILMS.length];
  const final = index % 2 === 0;
  return (
    <HeadlineCard
      key={index}
      id={film.id}
      href={`/movies/${film.id}`}
      title={film.title}
      posterPath={film.posterPath}
      eyebrow={`Day ${index + 1}, 19:30`}
      lead={final ? "Final screening" : "Q&A with the director"}
      detail="The Cinema Museum"
      tone={final ? "yellow" : "pink"}
      showMarkers={false}
      fluid
    />
  );
});

const VENUES = [
  "ActOne Cinema",
  "BFI Southbank",
  "The Cinema Museum",
  "Close-Up Film Centre",
  "Garden Cinema",
  "Prince Charles Cinema",
  "Rio Cinema",
];

/** The watchlist's Don't miss: two rows open, then the deck. */
export const Headlines: Story = {
  args: {
    label: "Don't miss",
    noun: ["film", "films"],
    minColumnWidth: 320,
    minOpen: 3,
    children: headlineCards,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const more = await canvas.findByRole("button", {
      name: /Don't miss: show \d+ more films/,
    });
    await userEvent.click(more);
    await expect(
      canvas.getByRole("button", { name: "Don't miss: show fewer" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getAllByRole("heading", { name: /Final screening|Q&A/ }),
    ).toHaveLength(9);
    await userEvent.click(
      canvas.getByRole("button", { name: "Don't miss: show fewer" }),
    );
    await expect(
      await canvas.findByRole("button", { name: /show \d+ more films/ }),
    ).toBeInTheDocument();
  },
};

/** My Venues, with what from the reader's watchlist each has on. */
export const Venues: Story = {
  args: {
    label: "My Venues",
    noun: ["venue", "venues"],
    minColumnWidth: 300,
    minOpen: 4,
    children: VENUES.map((name, index) => (
      <VenueCard
        key={name}
        href="#"
        name={name}
        type="Independent"
        imagePath={null}
        filmCount={12 - index}
        performanceCount={40 - index * 3}
        watchlistNote={index === 0 ? "Paris, Texas + 2 more" : undefined}
      />
    )),
  },
};

/** A list that fits is drawn whole, with no deck. */
export const Fits: Story = {
  args: {
    ...Venues.args,
    children: VENUES.slice(0, 3).map((name) => (
      <VenueCard key={name} href="#" name={name} imagePath={null} />
    )),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: /show/ }),
    ).not.toBeInTheDocument();
  },
};

/** Opened by `expandWhen`, as the editing buttons open it. */
export const Expanded: Story = {
  args: {
    ...Headlines.args,
    expandWhen: true,
  },
};

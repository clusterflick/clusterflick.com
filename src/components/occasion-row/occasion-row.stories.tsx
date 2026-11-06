import type { Meta, StoryObj } from "@storybook/react";
import OccasionRow, { type OccasionRowItem } from ".";

/**
 * `OccasionRow` is a horizontally-scrolling row of wide cards that lead with
 * what makes a screening an occasion — a guest, a live score, a premiere — in
 * large type, with the film, the day and the venue beneath. The poster sits
 * beside it and is blurred behind the card as a wash.
 *
 * **When to use:** "More Than a Screening" on the home page, where the
 * occasion is the reason to go and a poster subtitle was too small to carry it.
 *
 * **When NOT to use:** rows where the film is the point — use `PosterRow`; a
 * short grid of picks each with a reason label — use `PickCard`.
 */
const meta = {
  title: "Components/OccasionRow",
  component: OccasionRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof OccasionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const items: OccasionRowItem[] = [
  {
    id: "11645",
    href: "/movies/11645/ran",
    title: "Ran",
    posterPath: "/dGgiXMWDcS5aJTBEFu7bmaQPNox.jpg",
    occasion: "With an introduction",
    when: "Sun 8 Nov, 19:30",
    venue: "The Chiswick Cinema",
  },
  {
    id: "309",
    href: "/movies/309/the-celebration",
    title: "The Celebration",
    posterPath: "/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg",
    occasion: "Q&A with the director",
    when: "Wed 4 Nov, 19:30",
    venue: "The Cinema Museum",
  },
  {
    id: "626979",
    href: "/movies/626979/coup-53",
    title: "Coup 53",
    posterPath: "/Ar7iq23QZNh0ZX57uPc8e2IasvD.jpg",
    occasion:
      "In conversation with the director and the editor, followed by a panel on the archive",
    when: "Tue 10 Nov, 18:00",
    venue: "SOAS University of London",
  },
  {
    id: "silent",
    href: "/movies/silent/the-lodger",
    title: "The Lodger",
    occasion: "Live piano score",
    when: "Fri 13 Nov, 20:00",
    venue: "Cinema Museum",
  },
];

/** The home page's row, with a long occasion clamped and a film without a poster. */
export const Default: Story = {
  args: {
    title: "More Than a Screening",
    intro:
      "Q&As, live scores and premieres — nights you can't catch on another date.",
    items,
  },
};

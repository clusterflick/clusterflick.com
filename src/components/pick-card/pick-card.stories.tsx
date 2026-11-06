import type { Meta, StoryObj } from "@storybook/react";
import PickCard from ".";

/**
 * `PickCard` is one screening picked out for a reason: a poster, the reason as
 * a label, the film, and when and where it is on. The whole card links to the
 * film's page.
 *
 * Label colours follow the reason: blue for a format, pink for a night that
 * won't come round again, yellow for a final showing (the planner's "Last
 * chance" colour), grey for reach or an unusual venue.
 *
 * **When to use:** a short list of films each worth a sentence — the home
 * page's picks, three across on desktop.
 *
 * **When NOT to use:** browsing many films — use `FilmPosterGrid` or
 * `PosterRow`; a compact tile with a control under it — use `PosterTile`.
 */
const meta = {
  title: "Components/PickCard",
  component: PickCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 380 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PickCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A format screening at one venue. */
export const Format: Story = {
  args: {
    item: {
      id: "309",
      href: "/movies/309/the-celebration",
      title: "The Celebration",
      posterPath: "/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg",
      label: "35mm print",
      labelColor: "blue",
      credit: "Thomas Vinterberg · 1998",
      when: "Tomorrow, 19:30",
      where: "The Cinema Museum",
    },
  },
};

/** The last chance to see a film, in yellow. */
export const FinalShowing: Story = {
  args: {
    item: {
      id: "1488459",
      href: "/movies/1488459/the-scarecrows-wedding",
      title: "The Scarecrows' Wedding",
      posterPath: "/qoLvoJy0tnlxJ7jYVwXdPFf7oCe.jpg",
      label: "Final showing",
      labelColor: "yellow",
      credit: "Samantha Cutler & Jeroen Jaspaert · 2026",
      when: "Thursday, 10:25",
      where: "The Ritzy Picturehouse",
    },
  },
};

/** A film featured for its reach: no single venue, a count instead. */
export const Reach: Story = {
  args: {
    item: {
      id: "891621",
      href: "/movies/891621/wild-horse-nine",
      title: "Wild Horse Nine",
      posterPath: "/dNJFRtVg3xLQ7dbNIQ55cmmIniD.jpg",
      label: "Showing at 96 venues",
      labelColor: "gray",
      credit: "Martin McDonagh · 2026",
      when: "2,642 showings this week",
    },
  },
};

/** No poster: the text-pattern poster stands in. */
export const NoPoster: Story = {
  args: {
    item: {
      id: "unmatched",
      href: "/movies/abc/members-short-film-night",
      title: "Members' Short Film Night",
      label: "One night only",
      labelColor: "pink",
      when: "Friday, 19:00",
      where: "Rio Cinema",
    },
  },
};

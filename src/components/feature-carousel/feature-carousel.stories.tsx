import type { Meta, StoryObj } from "@storybook/react";
import FeatureCarousel, { type FeatureCarouselItem } from ".";

/**
 * `FeatureCarousel` is a full-width feature rotating through a few films: the
 * reason each is featured, when and where, a button to its showings and one to
 * its trailer. The active poster sits in front of a fan of the next ones and
 * is blurred behind the whole section as a wash of its colours. Each film's
 * progress bar is also the way to pick it.
 *
 * Rotation holds while the pointer or focus is inside, can be paused, and
 * never starts for a reader who prefers reduced motion. The static HTML shows
 * the first film.
 *
 * **When to use:** the top of the home page, for the handful of screenings the
 * editorial summary names. One per page.
 *
 * **When NOT to use:** a row of films to browse — use `PosterRow`; a grid of
 * picks with their reasons — use `PickCard`; a single film's header — use
 * `HeroSection`.
 */
const meta = {
  title: "Components/FeatureCarousel",
  component: FeatureCarousel,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FeatureCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const items: FeatureCarouselItem[] = [
  {
    id: "11645",
    href: "/movies/11645/ran",
    title: "Ran",
    posterPath: "/dGgiXMWDcS5aJTBEFu7bmaQPNox.jpg",
    label: "One night only",
    labelColor: "pink",
    credit: "Akira Kurosawa · 1985",
    rating: "4.5/5 on Letterboxd",
    when: "Sunday, 19:30",
    where: "The Chiswick Cinema",
    whereHref: "/venues/the-chiswick-cinema",
    overview:
      "Shakespeare's King Lear is reimagined as a singular historical epic set in sixteenth-century Japan where an aging warlord divides his kingdom between his three sons.",
    trailerUrl: "https://www.youtube.com/watch?v=29ukiH4_GvQ",
  },
  {
    id: "309",
    href: "/movies/309/the-celebration",
    title: "The Celebration",
    posterPath: "/2LRzNq41yrY8EjCnD1S8sCCPvKk.jpg",
    label: "35mm print",
    labelColor: "blue",
    credit: "Thomas Vinterberg · 1998",
    rating: "4.3/5 on Letterboxd",
    when: "Tomorrow, 19:30",
    where: "The Cinema Museum",
    whereHref: "/venues/the-cinema-museum",
    overview:
      "The family of a wealthy businessman gather to celebrate his 60th birthday. During the party, his eldest son gives a speech that reveals a devastating secret.",
    trailerUrl: "https://www.youtube.com/watch?v=XCqc_JTiNxg",
  },
  {
    id: "891621",
    href: "/movies/891621/wild-horse-nine",
    title: "Wild Horse Nine",
    posterPath: "/dNJFRtVg3xLQ7dbNIQ55cmmIniD.jpg",
    label: "Showing at 96 venues",
    labelColor: "gray",
    credit: "Martin McDonagh · 2026",
    rating: "4.1/5 on Letterboxd",
    when: "2,642 showings this week",
    overview:
      "Shortly before the 1973 Chilean coup, CIA agents Chris and Lee are dispatched from Santiago to Easter Island by their bureau chief, MJ.",
    trailerUrl: "https://www.youtube.com/watch?v=kqxuamKxRTo",
  },
  {
    id: "1488459",
    href: "/movies/1488459/the-scarecrows-wedding",
    title: "The Scarecrows' Wedding",
    posterPath: "/qoLvoJy0tnlxJ7jYVwXdPFf7oCe.jpg",
    label: "Final showing",
    labelColor: "yellow",
    credit: "Samantha Cutler & Jeroen Jaspaert · 2026",
    when: "Thursday, 10:25",
    where: "The Ritzy Picturehouse",
    whereHref: "/venues/the-ritzy-picturehouse",
  },
];

/** Four films, as the home page shows them. */
export const Default: Story = {
  args: { items },
};

/** A single film: no tabs, no rotation. */
export const SingleFilm: Story = {
  args: { items: items.slice(0, 1) },
};

/**
 * A film featured for its reach rather than one showing, with no venue, and
 * one with no rating, overview or trailer — the slide closes up around them.
 */
export const SparseDetails: Story = {
  args: { items: [items[2], items[3]] },
};

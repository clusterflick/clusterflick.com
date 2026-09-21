import type { Meta, StoryObj } from "@storybook/react";
import MovieSummary from ".";

/**
 * `MovieSummary` is a film's listing-page header compressed into a row: small
 * poster, title and year, then original title, certificate, running time and
 * genres. Poster and title both link to the listing page.
 *
 * **When to use:** a list where each row is one film and the row has other
 * work to do — the planner, where the summary sits above that day's showings.
 *
 * **When NOT to use:**
 * - A grid of films to browse. That is `VirtualisedFilmGrid` or
 *   `FilmPosterGrid`, where the poster is the point.
 * - The listing page itself, which has room for the full header.
 */
const meta = {
  title: "Components/MovieSummary",
  component: MovieSummary,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MovieSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A typical film with everything present. */
export const Default: Story = {
  args: {
    href: "/movies/28/apocalypse-now",
    title: "Apocalypse Now",
    year: "1979",
    classification: "15",
    duration: 8820000,
    genres: ["Drama", "War"],
    posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg",
  },
};

/** A non-English film shows its original title beneath. */
export const WithOriginalTitle: Story = {
  args: {
    href: "/movies/1/spirited-away",
    title: "Spirited Away",
    originalTitle: "千と千尋の神隠し",
    year: "2001",
    classification: "PG",
    duration: 7500000,
    genres: ["Animation", "Family", "Fantasy"],
  },
};

/**
 * An event with little metadata and no poster — the placeholder poster and a
 * bare title are all it gets, and the layout must not leave gaps for the rest.
 */
export const Sparse: Story = {
  args: {
    href: "/movies/2/pub-quiz",
    title: "Film Quiz Night",
  },
};

/** Long titles wrap rather than truncate: the title is what the row is for. */
export const Narrow: Story = {
  args: {
    href: "/movies/3/long",
    title:
      "Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",
    year: "1964",
    classification: "PG",
    duration: 5700000,
    genres: ["Comedy", "War"],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

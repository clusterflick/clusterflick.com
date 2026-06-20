import type { Meta, StoryObj } from "@storybook/react";
import type { Movie } from "@/types";
import PosterRow from "@/components/poster-row";

/**
 * `PosterRow` is a titled, horizontally-scrolling row of film posters — the same
 * presentation as the "Most Shown with…" rows on the accessibility page. It is
 * the building block for the discovery sections on the home page.
 *
 * **When to use:**
 * - Curated discovery rows (popular, new additions, last chance, marathons).
 *
 * **When NOT to use:**
 * - Full browse/filter surfaces — those use the virtualised grid on `/films`.
 *
 * Renders nothing when `movies` is empty, so sections self-hide.
 */
const meta = {
  title: "Components/PosterRow",
  component: PosterRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PosterRow>;

export default meta;
type Story = StoryObj<typeof meta>;

function makeMovie(
  partial: Partial<Movie> & { id: string; title: string },
): Movie {
  return {
    normalizedTitle: partial.title.toLowerCase(),
    showings: {},
    performances: [],
    ...partial,
  } as Movie;
}

const POSTER_FILMS = [
  makeMovie({
    id: "1",
    title: "Spirited Away",
    year: "2001",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  }),
  makeMovie({
    id: "2",
    title: "Moonlight",
    year: "2016",
    posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg",
  }),
  makeMovie({ id: "3", title: "Past Lives", year: "2023" }),
  makeMovie({ id: "4", title: "Poor Things", year: "2023" }),
  makeMovie({ id: "5", title: "The Zone of Interest", year: "2023" }),
];

/** A standard discovery row with mixed real posters and text-pattern fallbacks. */
export const Default: Story = {
  args: {
    title: "Showing Across London",
    movies: POSTER_FILMS.map((movie) => ({ movie })),
  },
};

/** Smaller sub-row heading (h3), as used under "New Additions". */
export const SubRowWithSubtitles: Story = {
  args: {
    title: "Back on the big screen",
    titleAs: "h3",
    movies: POSTER_FILMS.map((movie) => ({
      movie,
      subtitle: movie.year,
    })),
  },
};

/** Row with a "see all" link beside the title. */
export const WithSeeAll: Story = {
  args: {
    title: "Last Chance",
    movies: POSTER_FILMS.map((movie) => ({
      movie,
      subtitle: "Last showing Sun",
    })),
    seeAllHref: "/films",
    seeAllLabel: "Browse all",
  },
};

/** Marathon/double-bill row — stacked posters from included movies. */
export const Marathons: Story = {
  args: {
    title: "Marathons & Double Bills",
    movies: [
      makeMovie({
        id: "m1",
        title: "Lord of the Rings Trilogy",
        posterPath: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
        includedMovies: [
          {
            id: "a",
            title: "The Fellowship of the Ring",
            posterPath: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
          },
          {
            id: "b",
            title: "The Two Towers",
            posterPath: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
          },
          {
            id: "c",
            title: "The Return of the King",
            posterPath: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
          },
        ],
      }),
    ].map((movie) => ({ movie, subtitle: "3 films" })),
  },
};

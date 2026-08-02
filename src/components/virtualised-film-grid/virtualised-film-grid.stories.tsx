import type { Meta, StoryObj } from "@storybook/react";
import type { Movie } from "@/types";
import { Category } from "@/types";
import VirtualisedFilmGrid from "@/components/virtualised-film-grid";

const POSTERS = [
  "/pmpBOZjbLxHzGmxgqQqNVIKtWQ4.jpg",
  "/rjkmN1dniUHVYAtwuV3Tji7FsDO.jpg",
  "/6ksm1sjKMFLbO7UY2i6G1ju9SML.jpg",
  "/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg",
  "/pWsD91G2R1Da3AKM3ymr3UoIfRb.jpg",
  "/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
];

const film = (index: number): Movie =>
  ({
    id: `${index}`,
    title: `Example Film ${index + 1}`,
    normalizedTitle: `example film ${index + 1}`,
    year: `${1970 + (index % 50)}`,
    posterPath: POSTERS[index % POSTERS.length],
    showings: {
      [`s${index}`]: {
        id: `s${index}`,
        category: Category.Movie,
        venueId: "a.com",
        url: "https://example.com",
      },
    },
    performances: [],
  }) as unknown as Movie;

const films = (count: number) =>
  Array.from({ length: count }, (_, i) => film(i));

/**
 * Window-scrolled, virtualised grid of film posters, used by the films grid.
 *
 * **When to use:**
 * - A client-rendered page listing the whole catalogue (thousands of films),
 *   where rendering every poster at once would be expensive.
 *
 * **When NOT to use:**
 * - Anything server-rendered. Virtuoso renders no items during SSR unless
 *   `initialItemCount` is set, so the films would be missing from the static
 *   HTML. Use `FilmPosterGrid`, which lays out identically and renders
 *   everything, also supporting badges and truncation.
 */
const meta = {
  title: "Components/VirtualisedFilmGrid",
  component: VirtualisedFilmGrid,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof VirtualisedFilmGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default grid, as used by the films page. */
export const Default: Story = {
  args: {
    items: films(24).map((movie) => ({ movie })),
  },
};

/** A large set — the case virtualisation exists for. */
export const ManyFilms: Story = {
  args: {
    items: films(400).map((movie) => ({ movie })),
  },
};

/** A single film still lays out and centres correctly. */
export const SingleFilm: Story = {
  args: {
    items: [{ movie: film(0) }],
  },
};

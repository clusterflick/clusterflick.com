import type { Meta, StoryObj } from "@storybook/react";
import StackedPoster from "@/components/stacked-poster";

/**
 * `StackedPoster` renders a multi-film event as a fanned stack of poster cards.
 * Up to three posters are shown (background films + main film on top). When no
 * TMDB poster images are available, each card falls back to a text-pattern
 * placeholder derived from the movie title.
 *
 * **When to use:**
 * - Double bills, triple bills, and programme events that group multiple films
 *   under one ticket (e.g. a festival screening of two shorts + a feature).
 *
 * **When NOT to use:**
 * - Single-film screenings — use `MoviePoster` instead.
 */
const meta = {
  title: "Components/StackedPoster",
  component: StackedPoster,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["small", "large"],
    },
  },
} satisfies Meta<typeof StackedPoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single included film — only the main poster card is visible, centred in the
 * container.
 */
export const SingleFilm: Story = {
  args: {
    mainTitle: "Everything Everywhere All at Once",
    showOverlay: true,
    includedMovies: [
      {
        title: "Everything Everywhere All at Once",
        posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg",
      },
    ],
  },
};

/** Two films — the background card is offset to reveal the stack depth. */
export const TwoFilms: Story = {
  args: {
    mainTitle: "Forrest Gump",
    showOverlay: true,
    includedMovies: [
      { title: "Forrest Gump", posterPath: "/saHP97rTPS5eLmrLQEcANmKrsFl.jpg" },
      {
        title: "North by Northwest",
        posterPath: "/kNOFPQrel9YFCVzI0DF8FnCEpCw.jpg",
      },
    ],
  },
};

/** Three films — two background cards plus the main film on top. */
export const ThreeFilms: Story = {
  args: {
    mainTitle: "Moonlight",
    showOverlay: true,
    includedMovies: [
      { title: "Moonlight", posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg" },
      { title: "The Birds", posterPath: "/eClg8QPg8mwB6INIC4pyR5pAbDr.jpg" },
      {
        title: "North by Northwest",
        posterPath: "/kNOFPQrel9YFCVzI0DF8FnCEpCw.jpg",
      },
    ],
  },
};

/** Large size as used on detail page heroes. */
export const Large: Story = {
  args: {
    mainTitle: "Everything Everywhere All at Once",
    size: "large",
    showOverlay: true,
    includedMovies: [
      {
        title: "Everything Everywhere All at Once",
        posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg",
      },
      {
        title: "Space Cadet",
        posterPath: "/qhaxr8KrT8z8RMd3Z3KGLYaB9tN.jpg",
      },
    ],
  },
};

/** With a subtitle shown below the title in the overlay. */
export const WithSubtitle: Story = {
  args: {
    mainTitle: "Forrest Gump",
    subtitle: "3 showings this week",
    showOverlay: true,
    includedMovies: [
      { title: "Forrest Gump", posterPath: "/saHP97rTPS5eLmrLQEcANmKrsFl.jpg" },
      { title: "Moonlight", posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg" },
    ],
  },
};

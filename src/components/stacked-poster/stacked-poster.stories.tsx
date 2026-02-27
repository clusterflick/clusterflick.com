import type { Meta, StoryObj } from "@storybook/react";
import StackedPoster from "@/components/stacked-poster";

/**
 * `StackedPoster` renders a multi-film event as a fanned stack of poster cards.
 * Up to three posters are shown (background films + main film on top). When no
 * poster images are available, a text-pattern fallback is shown for each card.
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
    mainTitle: "Oppenheimer",
    includedMovies: [{ title: "A Short Film" }],
  },
};

/** Two films — the background card is offset to show the stack. */
export const TwoFilms: Story = {
  args: {
    mainTitle: "Dune: Part Two",
    includedMovies: [{ title: "Dune: Part One" }, { title: "Behind the Dune" }],
  },
};

/** Three films — two background cards plus the main film on top. */
export const ThreeFilms: Story = {
  args: {
    mainTitle: "Poor Things",
    includedMovies: [
      { title: "Kinds of Kindness" },
      { title: "The Favourite" },
      { title: "The Lobster" },
    ],
  },
};

/** Large size as used on detail page heroes. */
export const Large: Story = {
  args: {
    mainTitle: "Past Lives",
    size: "large",
    includedMovies: [{ title: "Aftersun" }, { title: "A24 Shorts" }],
  },
};

/** With overlay — title and subtitle shown on hover. */
export const WithOverlay: Story = {
  args: {
    mainTitle: "The Zone of Interest",
    subtitle: "3 showings this week",
    showOverlay: true,
    includedMovies: [{ title: "Short Documentary" }],
  },
};

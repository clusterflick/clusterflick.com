import type { Meta, StoryObj } from "@storybook/react";
import MoviePoster from "@/components/movie-poster";

/**
 * `MoviePoster` renders a TMDB poster image, or a text-pattern fallback when no
 * poster is available. The overlay (title + subtitle) is shown on hover, or
 * always-visible when no poster image is provided.
 *
 * **Sizes:**
 * - `"small"` (default, 200×300px) — used in the poster grid.
 * - `"large"` (308×462px) — used on the movie detail page hero.
 *
 * **When to use:**
 * - Film grid cards (home page poster grid).
 * - Movie detail page hero.
 * - Any context that needs a TMDB poster with a consistent size and fallback.
 *
 * **When NOT to use:**
 * - For multi-film events (e.g. double bills) — use `StackedPoster`.
 */
const meta = {
  title: "Components/MoviePoster",
  component: MoviePoster,
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
} satisfies Meta<typeof MoviePoster>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Poster with a real TMDB image — the default rendering path. */
export const WithPoster: Story = {
  args: {
    title: "Spirited Away",
    posterPath: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    showOverlay: true,
  },
};

/** Large size with a real poster, as used on the movie detail page hero. */
export const WithPosterLarge: Story = {
  args: {
    title: "Moonlight",
    posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg",
    size: "large",
    showOverlay: true,
  },
};

/**
 * Text-pattern fallback — rendered when no TMDB poster path is provided.
 * The title is repeated in a diagonal pattern using a colour derived from the
 * title string.
 */
export const TextPattern: Story = {
  args: {
    title: "Oppenheimer",
  },
};

/** Large text-pattern poster as used on the movie detail page hero. */
export const TextPatternLarge: Story = {
  args: {
    title: "Oppenheimer",
    size: "large",
  },
};

/** Text-pattern poster with the title/subtitle overlay always visible. */
export const TextPatternWithOverlay: Story = {
  args: {
    title: "Dune: Part Two",
    subtitle: "12 showings this week",
    showOverlay: true,
  },
};

/** Non-interactive poster — no hover animations. Used for static display. */
export const NonInteractive: Story = {
  args: {
    title: "Past Lives",
    interactive: false,
  },
};

/** A range of titles showing the colour variety from `getPosterColor`. */
export const ColorVariety: Story = {
  args: { title: "Oppenheimer" },
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {[
        "Oppenheimer",
        "Past Lives",
        "Dune: Part Two",
        "Poor Things",
        "The Zone of Interest",
        "Killers of the Flower Moon",
      ].map((title) => (
        <MoviePoster key={title} title={title} />
      ))}
    </div>
  ),
};

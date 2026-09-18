"use client";

import type { Meta, StoryObj } from "@storybook/react";
import HiddenResultsNotice from "@/components/hidden-results-notice";

/**
 * `HiddenResultsNotice` sits under a short films grid and says what the date
 * window is keeping out, with one way to reveal it.
 *
 * **When to use:** a filtered grid returned a handful of films and widening the
 * dates would return meaningfully more. `getHiddenByDate` decides that.
 *
 * **When NOT to use:**
 * - An empty grid — that is `EmptyState` with `FilterSuggestions`, which can
 *   pair the date with whatever else is wrong rather than only knowing dates.
 * - A full grid. The reader is already scrolling real results and a note about
 *   more of them is noise.
 *
 * It is deliberately quieter than a suggestion: the reader's search worked, and
 * this only points out that the answer is narrower than it looks.
 */
const meta = {
  title: "Components/HiddenResultsNotice",
  component: HiddenResultsNotice,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HiddenResultsNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

const IN_THREE_WEEKS = Date.now() + 21 * 24 * 60 * 60 * 1000;

/** The case this exists for: searching a cast member with most of their films later in the year. */
export const Default: Story = {
  args: {
    count: 3,
    from: IN_THREE_WEEKS,
    onShowAll: () => {},
  },
};

/** One hidden film is the commonest case by some way — the copy has to read singular. */
export const SingleFilm: Story = {
  args: {
    count: 1,
    from: IN_THREE_WEEKS,
    onShowAll: () => {},
  },
};

/** A long retrospective announced well ahead. */
export const Many: Story = {
  args: {
    count: 21,
    from: Date.now() + 60 * 24 * 60 * 60 * 1000,
    onShowAll: () => {},
  },
};

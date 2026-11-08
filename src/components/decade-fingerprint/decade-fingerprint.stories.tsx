import type { Meta, StoryObj } from "@storybook/react";
import DecadeFingerprint from "@/components/decade-fingerprint";

/**
 * `DecadeFingerprint` lays each row's screenings end to end, coloured by the
 * decade of their film, so the age of a programme reads at a glance.
 *
 * **When to use:**
 * - Comparing what a handful of venues show across the decades — a repertory
 *   cinema's spread against a multiplex's single block.
 * - Up to ~10 rows, each with enough screenings for its shares to mean
 *   something.
 *
 * **When NOT to use:**
 * - A single share per row ("86% of films 25+ years old") — that's a
 *   `RankedBarChart`.
 * - Exact comparisons between decades — the strips show the pattern; the
 *   table behind them carries the numbers.
 */
const meta = {
  title: "Components/DecadeFingerprint",
  component: DecadeFingerprint,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DecadeFingerprint>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Repertory venues against a multiplex, which is drawn muted for contrast. */
export const RepertoryAgainstMultiplex: Story = {
  args: {
    caption: "Screenings by the decade of their film",
    labelHeading: "Venue",
    detailHeading: "Films 25+ years old",
    items: [
      {
        key: "nickel",
        label: "The Nickel",
        highlight: true,
        detail: "86%",
        decades: {
          1920: 4,
          1930: 3,
          1940: 4,
          1950: 6,
          1960: 44,
          1970: 190,
          1980: 158,
          1990: 85,
          2000: 34,
          2010: 20,
          2020: 43,
        },
      },
      {
        key: "pcc",
        label: "Prince Charles Cinema",
        detail: "70%",
        decades: {
          1920: 13,
          1930: 2,
          1940: 35,
          1950: 92,
          1960: 151,
          1970: 290,
          1980: 415,
          1990: 423,
          2000: 376,
          2010: 179,
          2020: 320,
        },
      },
      {
        key: "vue",
        label: "Vue Westfield London",
        muted: true,
        detail: "1%",
        decades: {
          1970: 8,
          1980: 166,
          1990: 60,
          2000: 191,
          2010: 251,
          2020: 30335,
        },
      },
    ],
  },
};

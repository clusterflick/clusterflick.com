import type { Meta, StoryObj } from "@storybook/react";
import FilmStockChart from "@/components/film-stock-chart";

/**
 * `FilmStockChart` draws each screening format as the stock it stands for: as
 * thick as its gauge, to scale, with perforations, or as tape. Each bar's
 * length is its screenings.
 *
 * **When to use:**
 * - Formats on film and tape (16mm, 35mm, 70mm, VHS), where the gauge is part
 *   of the story.
 *
 * **When NOT to use:**
 * - Anything that isn't a physical format — the thickness would mean nothing.
 *   Use `RankedBarChart`.
 */
const meta = {
  title: "Components/FilmStockChart",
  component: FilmStockChart,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FilmStockChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Split into one film and everything else, with a legend. */
export const Split: Story = {
  args: {
    caption: "Screenings from film and tape, by format",
    labelHeading: "Format",
    valueHeading: "Screenings",
    split: { split: "Everything else", rest: "The Odyssey" },
    items: [
      {
        key: "35mm",
        label: "35mm",
        gauge: 35,
        stock: "film",
        value: 744,
        splitValue: 497,
      },
      {
        key: "70mm",
        label: "70mm",
        gauge: 70,
        stock: "film",
        value: 357,
        splitValue: 30,
      },
      {
        key: "imax",
        label: "IMAX 70mm",
        gauge: 70,
        stock: "film",
        value: 343,
        splitValue: 2,
      },
      {
        key: "16mm",
        label: "16mm",
        gauge: 16,
        stock: "film",
        value: 26,
        splitValue: 26,
      },
      {
        key: "vhs",
        label: "VHS",
        gauge: 12.7,
        stock: "tape",
        value: 11,
        splitValue: 11,
      },
    ],
  },
};

/** Without a split, every bar in one colour. */
export const Plain: Story = {
  args: {
    caption: "Screenings by format",
    labelHeading: "Format",
    valueHeading: "Screenings",
    items: [
      { key: "35mm", label: "35mm", gauge: 35, stock: "film", value: 497 },
      { key: "16mm", label: "16mm", gauge: 16, stock: "film", value: 26 },
      { key: "vhs", label: "VHS", gauge: 12.7, stock: "tape", value: 11 },
    ],
  },
};

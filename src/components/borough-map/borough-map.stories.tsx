import type { Meta, StoryObj } from "@storybook/react";
import BoroughMap, {
  type BoroughMapBand,
  type BoroughMapItem,
} from "@/components/borough-map";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { getBoroughMapShapes } from "@/utils/get-borough-map-shapes";
import { FILM_BAND_LABELS } from "@/utils/get-borough-stats";

/**
 * `BoroughMap` shades London's boroughs by one quantity, each borough linking
 * to its page. The SVG is server-rendered, so the map and its links are in the
 * static HTML; pointing at or focusing a borough names it in the readout above
 * and outlines it in yellow.
 *
 * **When to use:**
 * - A figure per borough where where-in-London is the point (what's on in
 *   each borough on `/london-cinemas`).
 *
 * **When NOT to use:**
 * - On its own. A tap on a phone follows the link, so the readout never shows
 *   there: pair it with a `RankedBarChart` of the same figures, which is also
 *   the table view.
 * - For venues, which are points rather than areas: use `VenueMap`.
 */
const meta = {
  title: "Components/BoroughMap",
  component: BoroughMap,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BoroughMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const shapes = getBoroughMapShapes();

function itemsFor(
  bandOf: (slug: string, index: number) => BoroughMapBand,
): BoroughMapItem[] {
  return LONDON_BOROUGHS.map((borough, index) => {
    const band = bandOf(borough.slug, index);
    return {
      key: borough.slug,
      label: borough.name,
      path: shapes.paths[borough.slug],
      href:
        band === "no-venues" ? undefined : `/london-cinemas/${borough.slug}`,
      band,
      readout:
        typeof band === "number"
          ? `${borough.name}: ${FILM_BAND_LABELS[band]} films`
          : `${borough.name}: ${band === "no-venues" ? "no venues listed" : "nothing on"}`,
    };
  });
}

/** Every band in use, as the page draws a typical week. */
export const Default: Story = {
  args: {
    viewBox: shapes.viewBox,
    bands: FILM_BAND_LABELS,
    caption: "Films showing in the next 7 days",
    prompt: "Point at a borough to see what's on there",
    items: itemsFor((slug, index) =>
      slug === "lewisham" ? 0 : (index % 4) + 1,
    ),
  },
};

/**
 * The two states that aren't a quantity: venues with nothing on are grey, and
 * a borough with no venues is an unlinked dashed outline. Each appears in the
 * key only when some borough is in it.
 */
export const NothingOnAndNoVenues: Story = {
  args: {
    ...Default.args,
    items: itemsFor((slug, index) => {
      if (slug === "lewisham") return "nothing-on";
      if (slug === "bexley") return "no-venues";
      return (index % 5) as BoroughMapBand;
    }),
  },
};

/** Fewer bands still run from the dimmest step of the ramp to the brightest. */
export const ThreeBands: Story = {
  args: {
    ...Default.args,
    bands: ["Few", "Some", "Many"],
    items: itemsFor((_, index) => index % 3),
  },
};

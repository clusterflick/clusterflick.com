import type { Meta, StoryObj } from "@storybook/react";
import VenueDotMap from "@/components/venue-dot-map";
import { getBoroughMapShapes } from "@/utils/get-borough-map-shapes";

/**
 * `VenueDotMap` places venues as dots over London's borough outlines, coloured
 * by group, with each group counted in the legend.
 *
 * **When to use:**
 * - Showing where a kind of place is, across all of London, as a picture —
 *   a report's "where London watches films".
 * - A fixed snapshot: it is drawn at build time and doesn't pan or zoom.
 *
 * **When NOT to use:**
 * - Finding a venue to go to — use `VenueMap`, which pans, zooms and links.
 * - A figure per borough — use `BoroughMap`, which shades the areas.
 */
const meta = {
  title: "Components/VenueDotMap",
  component: VenueDotMap,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof VenueDotMap>;

export default meta;
type Story = StoryObj<typeof meta>;

const shapes = getBoroughMapShapes();
const at = (
  key: string,
  group: string,
  label: string,
  lon: number,
  lat: number,
) => {
  const [x, y] = shapes.project(lon, lat);
  return { key, group, label, x, y };
};

/** Cinemas muted underneath, the other kinds of place in colour. */
export const Default: Story = {
  args: {
    caption: "Places that screened films, by kind",
    viewBox: shapes.viewBox,
    outlines: Object.values(shapes.paths),
    groups: [
      { key: "cinema", label: "Cinemas", color: "#5a5a6e", muted: true },
      { key: "pub", label: "Pubs and bars", color: "#f12869" },
      { key: "library", label: "Libraries", color: "#319edb" },
    ],
    items: [
      at("pcc", "cinema", "Prince Charles Cinema", -0.1303, 51.5112),
      at("rio", "cinema", "Rio Cinema", -0.0753, 51.5487),
      at("superstore", "pub", "Dalston Superstore", -0.0753, 51.5468),
      at("haggerston", "pub", "The Haggerston", -0.0734, 51.5377),
      at("deptford", "library", "Deptford Lounge", -0.0262, 51.4774),
    ],
  },
};

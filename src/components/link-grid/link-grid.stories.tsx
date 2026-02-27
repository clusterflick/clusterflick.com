import type { Meta, StoryObj } from "@storybook/react";
import LinkGrid from "@/components/link-grid";

/**
 * `LinkGrid` renders a responsive multi-column grid of labelled links with
 * optional count badges. It auto-fills columns based on a minimum item width,
 * collapsing to a single column on narrow viewports.
 *
 * **When to use:**
 * - Large flat lists of navigable items (venues, boroughs) where multi-column
 *   layout helps the user scan quickly.
 * - Any flat list of 10+ links.
 *
 * **When NOT to use:**
 * - Short lists where a single column reads more naturally — use `LinkedList`
 *   instead (also supports an optional detail string and "Show all" toggle).
 * - Lists that need rich card content — use `CardGrid` + `LinkCard`.
 */
const meta = {
  title: "Components/LinkGrid",
  component: LinkGrid,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    minItemWidth: {
      control: { type: "number", min: 100, max: 400, step: 10 },
      description:
        "Minimum column width in px. Columns auto-fill to fill available width. Defaults to 220.",
    },
  },
} satisfies Meta<typeof LinkGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const VENUES = [
  { key: "bfi", href: "/venues/bfi", label: "BFI Southbank", count: 48 },
  {
    key: "barbican",
    href: "/venues/barbican",
    label: "Barbican Cinema",
    count: 32,
  },
  {
    key: "prince-charles",
    href: "/venues/prince-charles",
    label: "Prince Charles Cinema",
    count: 27,
  },
  {
    key: "curzon-soho",
    href: "/venues/curzon-soho",
    label: "Curzon Soho",
    count: 21,
  },
  {
    key: "genesis",
    href: "/venues/genesis",
    label: "Genesis Cinema",
    count: 19,
  },
  {
    key: "electric",
    href: "/venues/electric",
    label: "Electric Cinema",
    count: 15,
  },
  { key: "rio", href: "/venues/rio", label: "Rio Cinema", count: 12 },
  {
    key: "everyman",
    href: "/venues/everyman",
    label: "Everyman Canary Wharf",
    count: 10,
  },
  {
    key: "ciné-lumiere",
    href: "/venues/cine-lumiere",
    label: "Ciné Lumière",
    count: 8,
  },
  {
    key: "picturehouse",
    href: "/venues/picturehouse",
    label: "Picturehouse Central",
    count: 6,
  },
];

const BOROUGHS = [
  {
    key: "hackney",
    href: "/london-cinemas/hackney",
    label: "Hackney",
    count: 7,
  },
  {
    key: "southwark",
    href: "/london-cinemas/southwark",
    label: "Southwark",
    count: 6,
  },
  {
    key: "camden",
    href: "/london-cinemas/camden",
    label: "Camden",
    count: 5,
  },
  {
    key: "westminster",
    href: "/london-cinemas/westminster",
    label: "Westminster",
    count: 8,
  },
  {
    key: "tower-hamlets",
    href: "/london-cinemas/tower-hamlets",
    label: "Tower Hamlets",
    count: 4,
  },
  {
    key: "islington",
    href: "/london-cinemas/islington",
    label: "Islington",
    count: 3,
  },
];

/**
 * Default — venue list with count badges, 220px minimum column width. Used on
 * the Venues page inside each category group.
 */
export const WithCounts: Story = {
  args: {
    items: VENUES,
  },
};

/**
 * Wider minimum column width (260px) used on the London Cinemas page for
 * borough names, which tend to be slightly longer.
 */
export const WiderColumns: Story = {
  args: {
    items: BOROUGHS,
    minItemWidth: 260,
  },
};

/**
 * Items without count badges — the badge is omitted when `count` is absent or
 * zero.
 */
export const WithoutCounts: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items: VENUES.map(({ count, ...item }) => item),
  },
};

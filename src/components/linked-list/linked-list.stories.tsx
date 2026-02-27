import type { Meta, StoryObj } from "@storybook/react";
import LinkedList from "@/components/linked-list";

/**
 * `LinkedList` renders a single-column list of labelled links separated by
 * dividers. Items can carry an optional `detail` string (displayed
 * right-aligned), and the list can be truncated with a "Show all" toggle.
 *
 * **When to use:**
 * - Short-to-medium lists (up to ~15 items) where a single column reads
 *   naturally: festivals at a venue, nearby venues, links with detail strings.
 * - Any flat link list that needs a "show all" truncation toggle.
 *
 * **When NOT to use:**
 * - Large lists (10+ links, no detail strings) — use `LinkGrid` for a
 *   compact multi-column responsive layout.
 * - Lists that need rich card content — use `CardGrid` + `LinkCard`.
 */
const meta = {
  title: "Components/LinkedList",
  component: LinkedList,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LinkedList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Simple list of links — no detail string, no truncation. */
export const Simple: Story = {
  args: {
    items: [
      { key: "lff", href: "/festivals/lff", label: "BFI London Film Festival" },
      {
        key: "horrorfest",
        href: "/festivals/horrorfest",
        label: "Arrow Video FrightFest",
      },
      {
        key: "docfest",
        href: "/festivals/docfest",
        label: "Sheffield Doc/Fest",
      },
    ],
  },
};

/** Links with a right-aligned detail string — used for nearby-venue distances. */
export const WithDetail: Story = {
  args: {
    items: [
      {
        key: "bfi",
        href: "/venues/bfi-southbank",
        label: "BFI Southbank",
        detail: "0.3 mi",
      },
      {
        key: "barbican",
        href: "/venues/barbican",
        label: "Barbican Cinema",
        detail: "0.7 mi",
      },
      {
        key: "curzon",
        href: "/venues/curzon-soho",
        label: "Curzon Soho",
        detail: "1.2 mi",
      },
      {
        key: "picturehouse",
        href: "/venues/picturehouse",
        label: "Picturehouse Central",
        detail: "1.4 mi",
      },
    ],
  },
};

/**
 * Long list truncated to the first 3 items with a "Show all" toggle. Used on
 * venue detail pages to list nearby venues without overwhelming the page.
 */
export const WithShowAll: Story = {
  args: {
    items: [
      {
        key: "bfi",
        href: "/venues/bfi-southbank",
        label: "BFI Southbank",
        detail: "0.3 mi",
      },
      {
        key: "barbican",
        href: "/venues/barbican",
        label: "Barbican Cinema",
        detail: "0.7 mi",
      },
      {
        key: "curzon",
        href: "/venues/curzon-soho",
        label: "Curzon Soho",
        detail: "1.2 mi",
      },
      {
        key: "picturehouse",
        href: "/venues/picturehouse",
        label: "Picturehouse Central",
        detail: "1.4 mi",
      },
      {
        key: "prince-charles",
        href: "/venues/prince-charles",
        label: "Prince Charles Cinema",
        detail: "1.5 mi",
      },
      {
        key: "odeon-luxe",
        href: "/venues/odeon-luxe",
        label: "Odeon Luxe Leicester Square",
        detail: "1.6 mi",
      },
    ],
    initialCount: 3,
    showAllLabel: "Show all 6 nearby venues",
  },
};

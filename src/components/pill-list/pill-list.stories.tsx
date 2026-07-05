import type { Meta, StoryObj } from "@storybook/react";
import PillList from "@/components/pill-list";

/**
 * `PillList` renders a labelled, horizontally-wrapping list of pill items with
 * an optional "+N more" truncation toggle. Items default to plain strings (e.g.
 * cast names), but a `renderItem` callback can render richer pills such as a
 * link plus a suffix. Set `maxVisibleMobile` to show fewer pills on small
 * screens (a responsive mobile/desktop pair is rendered automatically).
 *
 * **When to use:**
 * - Movie detail credits (directors, cast) and the "Playing at" venue summary.
 * - Any short, scannable set of labelled pills that may need progressive reveal.
 *
 * **When NOT to use:**
 * - For navigation links in a column — use `LinkedList`.
 * - For colour-coded genre/accessibility tags — use `Tag`.
 */
const meta = {
  title: "Components/PillList",
  component: PillList,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PillList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single item — no expand/collapse needed. */
export const Single: Story = {
  args: {
    title: "Director",
    items: ["Christopher Nolan"],
  },
};

/** Short list where all items fit without truncation. */
export const Short: Story = {
  args: {
    title: "Writers",
    items: ["Christopher Nolan", "Jonathan Nolan"],
  },
};

/** Long list truncated to the first 4 items. Click "+3 more" to expand. */
export const Truncated: Story = {
  args: {
    title: "Cast",
    items: [
      "Cillian Murphy",
      "Emily Blunt",
      "Matt Damon",
      "Robert Downey Jr.",
      "Florence Pugh",
      "Josh Hartnett",
      "Casey Affleck",
    ],
    maxVisible: 4,
  },
};

/** Fewer pills on mobile (2) than desktop (4) — resize to see the toggle switch. */
export const Responsive: Story = {
  args: {
    title: "Cast",
    items: [
      "Cillian Murphy",
      "Emily Blunt",
      "Matt Damon",
      "Robert Downey Jr.",
      "Florence Pugh",
      "Josh Hartnett",
    ],
    maxVisible: 4,
    maxVisibleMobile: 2,
  },
};

/**
 * Rich pills via `renderItem` — here a link plus a muted suffix, as used by the
 * "Playing at" venue list.
 */
export const WithRenderItem: StoryObj = {
  render: () => (
    <PillList
      title="Playing at"
      itemNoun="venues"
      maxVisible={3}
      items={[
        {
          name: "The Castle Cinema",
          href: "/venues/the-castle-cinema",
          meta: "0.1 miles",
        },
        { name: "Rio Cinema", href: "/venues/rio-cinema", meta: "0.4 miles" },
        {
          name: "Genesis Cinema",
          href: "/venues/genesis-cinema",
          meta: "0.6 miles",
        },
        { name: "Barbican", href: "/venues/barbican", meta: "1.4 miles" },
      ]}
      renderItem={(venue) => (
        <>
          <a href={venue.href}>{venue.name}</a>
          <span style={{ color: "var(--color-muted-gray)", fontSize: 13 }}>
            {venue.meta}
          </span>
        </>
      )}
    />
  ),
};

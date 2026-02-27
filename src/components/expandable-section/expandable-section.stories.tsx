import type { Meta, StoryObj } from "@storybook/react";
import ExpandableSection from "@/components/expandable-section";

/**
 * `ExpandableSection` is a disclosure widget — a labelled section that can be
 * expanded or collapsed. Fully accessible with `aria-expanded` and
 * `aria-controls`.
 *
 * **When to use:**
 * - Secondary content on detail pages that most users do not need immediately
 *   (e.g. accessibility info, extended descriptions).
 * - Any block of content that benefits from progressive disclosure.
 *
 * **When NOT to use:**
 * - For a "show more / show less" on a list of names — use `CreditsList`.
 * - For a list of links with a toggle — use `LinkedList` with `initialCount`.
 */
const meta = {
  title: "Components/ExpandableSection",
  component: ExpandableSection,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ExpandableSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed by default — the user must tap to expand. */
export const Collapsed: Story = {
  args: {
    title: "Accessibility information",
    children: (
      <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.8 }}>
        This venue has step-free access via the main entrance. A hearing loop is
        available at the box office. Accessible toilets are located on the
        ground floor.
      </p>
    ),
  },
};

/** Expanded by default — content is visible on first render. */
export const Expanded: Story = {
  args: {
    title: "About this screening",
    defaultExpanded: true,
    children: (
      <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.8 }}>
        This is a special late-night screening followed by a Q&amp;A with the
        director. Doors open 30 minutes before the film starts. The runtime
        including the Q&amp;A is approximately 3 hours.
      </p>
    ),
  },
};

/** Rich content inside the expandable — a nested list. */
export const WithList: Story = {
  args: {
    title: "What to expect",
    children: (
      <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2, opacity: 0.8 }}>
        <li>Step-free access</li>
        <li>Hearing loop at box office</li>
        <li>Accessible toilets on ground floor</li>
        <li>Large print programmes available on request</li>
      </ul>
    ),
  },
};

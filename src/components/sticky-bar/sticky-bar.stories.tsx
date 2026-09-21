import type { Meta, StoryObj } from "@storybook/react";
import Button from "@/components/button";
import StickyBar from ".";

/**
 * `StickyBar` holds a page's primary controls in a full-width strip that sticks
 * beneath the fixed header, so they stay in reach down a long list.
 *
 * **When to use:** the controls of a long, scrolling results page — the
 * catalogue's search row and the planner's day stepper. Using it on both keeps
 * the controls in the same place as a reader moves between the two.
 *
 * **When NOT to use:**
 * - Section headings inside a list (the listing page's sticky day headers
 *   belong to Virtuoso's grouped list, not to the page).
 * - Anything a reader doesn't need at every scroll position: the bar costs
 *   screen height for as long as the page is scrolled.
 *
 * It supplies its own gutters, so it goes outside any padded content column;
 * the page passes margins through `className` for its own spacing.
 */
const meta = {
  title: "Components/StickyBar",
  component: StickyBar,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StickyBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Controls centred in the bar, as both pages lay them out. */
export const Default: Story = {
  args: {
    children: (
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <Button variant="secondary" size="sm">
          Previous
        </Button>
        <Button variant="secondary" size="sm">
          Next
        </Button>
      </div>
    ),
  },
};

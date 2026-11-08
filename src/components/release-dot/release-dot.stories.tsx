import type { Meta, StoryObj } from "@storybook/react";
import ReleaseDot from "@/components/release-dot";

/**
 * `ReleaseDot` marks how fresh the published data is: green and pulsing while
 * fresh, a hollow yellow ring once stale.
 *
 * **When to use:**
 * - Beside a line saying when the data last changed (the home page's
 *   "Listings updated", the About page's status, `ReleaseFreshness`).
 *
 * **When NOT to use:**
 * - As decoration. Green is the release-status colour and means nothing else.
 *
 * Place it as the first child of the text it describes, not as a flex sibling
 * of it: it is inline, so it stays beside the first word when the text wraps
 * or is centred.
 */
const meta = {
  title: "Components/ReleaseDot",
  component: ReleaseDot,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <p style={{ maxWidth: 260, textAlign: "center", color: "#ccc" }}>
        <Story />
        Data last refreshed 2 hours ago, on Friday 6 November at 09:14.
      </p>
    ),
  ],
} satisfies Meta<typeof ReleaseDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fresh: Story = {};

export const Stale: Story = { args: { stale: true } };

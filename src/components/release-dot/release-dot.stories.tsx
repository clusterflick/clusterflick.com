import type { Meta, StoryObj } from "@storybook/react";
import ReleaseDot from "@/components/release-dot";

/**
 * `ReleaseDot` marks whether something is live: green and pulsing while the
 * published data is fresh or a profile is public, a hollow yellow ring once
 * the data is stale, and a still pink dot while a profile is private.
 *
 * **When to use:**
 * - Beside a profile's status ("Your profile is public"), with `off` while
 *   it's private.
 * - Beside a line saying when the data last changed (the home page's
 *   "Listings updated", the About page's status, `ReleaseFreshness`).
 *
 * **When NOT to use:**
 * - As decoration. Green means live and nothing else.
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

/** Off: a private profile. Still, and pink rather than an alarm. */
export const Off: Story = { args: { off: true } };

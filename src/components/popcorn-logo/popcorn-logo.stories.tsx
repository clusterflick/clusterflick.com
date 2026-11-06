import type { Meta, StoryObj } from "@storybook/react";
import PopcornLogo from "@/components/popcorn-logo";

/**
 * `PopcornLogo` is the Clusterflick popcorn drawn inline, so its kernels can
 * move: they pop out of the box as it first renders, and hop when hovered.
 * With reduced motion preferred it is still.
 *
 * **When to use:**
 * - As the centrepiece of a hero where the logo is the subject, as on the
 *   about page.
 *
 * **When NOT to use:**
 * - For the logo as a small mark (headers, footers, favicons) — use the static
 *   `/images/logo.svg`. Motion there would distract from the page, and the
 *   inline paths add ~12KB to the HTML each time it's used.
 */
const meta = {
  title: "Components/PopcornLogo",
  component: PopcornLogo,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PopcornLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The size the about page hero uses. Reload the story to see it pop. */
export const Default: Story = {};

/** The phone size the about page hero uses. */
export const Small: Story = {
  args: { size: 140 },
};

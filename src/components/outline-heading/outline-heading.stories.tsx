import type { Meta, StoryObj } from "@storybook/react";
import OutlineHeading from "@/components/outline-heading";

/**
 * `OutlineHeading` renders a heading with a decorative outline/shadow text
 * effect — the text is rendered twice: once as a solid fill, once as an
 * outlined stroke offset slightly behind it. This creates the neon-glow
 * branding style used throughout Clusterflick.
 *
 * **When to use:**
 * - For the primary page title inside a `HeroSection`.
 * - For group-level headings inside `GroupHeader`.
 * - Use `color="pink"` (default) for film/event/venue headings.
 * - Use `color="blue"` for informational/technical headings.
 *
 * **When NOT to use:**
 * - For body text or section headings within page content — use plain `<h2>`
 *   / `<h3>` or `ContentSection` for those.
 * - Children **must** be a plain string — nested JSX/HTML is not supported
 *   because the text is duplicated internally for the outline effect.
 */
const meta = {
  title: "Components/OutlineHeading",
  component: OutlineHeading,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    as: {
      control: "select",
      options: ["h1", "h2", "h3", "div"],
      description: "Semantic heading element. Defaults to h1.",
    },
    color: {
      control: "select",
      options: ["pink", "blue"],
      description:
        '"pink" (default) for page titles. "blue" for group headings.',
    },
  },
} satisfies Meta<typeof OutlineHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pink (default) — used for page titles inside heroes. */
export const Pink: Story = {
  args: {
    children: "Venues",
    color: "pink",
    as: "h1",
  },
};

/** Blue variant — used inside GroupHeader and for informational sections. */
export const Blue: Story = {
  args: {
    children: "Behind the Scenes",
    color: "blue",
    as: "h2",
  },
};

/** Longer title to show how the font scales on multiple words. */
export const LongTitle: Story = {
  args: {
    children: "London Cinemas",
    color: "pink",
    as: "h1",
  },
};

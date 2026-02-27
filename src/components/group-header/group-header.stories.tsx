import type { Meta, StoryObj } from "@storybook/react";
import GroupHeader from "@/components/group-header";

/**
 * `GroupHeader` renders a decorative section-group header: a neon icon above
 * an `OutlineHeading`. It introduces a cluster of related `ContentSection`s
 * and provides strong visual hierarchy on content-heavy pages.
 *
 * **When to use:**
 * - At the start of a major thematic group of sections (e.g. "Connect" and
 *   "Behind the Scenes" on the About page).
 * - Each page should have at most one or two `GroupHeader`s — they are
 *   intentionally heavyweight visually.
 *
 * **When NOT to use:**
 * - For individual content blocks within a group — use `ContentSection` there.
 * - For the primary page heading in a hero — use `OutlineHeading` directly
 *   inside `HeroSection`.
 */
const meta = {
  title: "Components/GroupHeader",
  component: GroupHeader,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    as: {
      control: "select",
      options: ["h1", "h2", "h3"],
    },
    color: {
      control: "select",
      options: ["pink", "blue"],
      description:
        '"blue" (default) is used for informational/technical group headers. "pink" for creative/event-focused groups.',
    },
  },
} satisfies Meta<typeof GroupHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default blue group header as used on the About page's "Behind the Scenes"
 * section.
 */
export const Default: Story = {
  args: {
    icon: "/images/icons/neon-projector.svg",
    iconWidth: 80,
    iconHeight: 66,
    title: "Behind the Scenes",
  },
};

/**
 * Pink group header variant for creative or community-focused groupings.
 */
export const Pink: Story = {
  args: {
    icon: "/images/icons/neon-clapper.svg",
    iconWidth: 66,
    iconHeight: 66,
    title: "Connect",
    color: "pink",
  },
};

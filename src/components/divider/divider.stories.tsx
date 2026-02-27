import type { Meta, StoryObj } from "@storybook/react";
import Divider from "@/components/divider";

/**
 * `Divider` renders a horizontal rule (`<hr>`) that visually separates major
 * sections of a page. It is styled with a subtle gradient fade.
 *
 * **When to use:**
 * - Between the hero/header area and the main page content.
 * - Between distinct major sections when a clear visual break is needed.
 *
 * **When NOT to use:**
 * - Between items inside a list or grid — CSS gap/margin is more appropriate.
 * - As a heading separator — use `ContentSection` or `GroupHeader` instead.
 */
const meta = {
  title: "Components/Divider",
  component: Divider,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default divider used between page hero and content. */
export const Default: Story = {};

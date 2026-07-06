import type { Meta, StoryObj } from "@storybook/react";
import Tag from "@/components/tag";

/**
 * `Tag` is a pill/badge used for categorisation labels, genre tags,
 * accessibility features, and similar metadata. It is display-only by default,
 * but passing `href` turns it into an internal link while keeping the pill
 * appearance (no underline, subtle brightness on hover/focus).
 *
 * **When to use:**
 * - Genre labels on movie cards and detail pages (linked to genre pages via
 *   `href`).
 * - Accessibility feature indicators (e.g. "Audio Described", "Captioned").
 * - Any other category or classification badge, static or linked.
 *
 * **Colour guide:**
 * - `"pink"` (default) — primary genre/category tags.
 * - `"blue"` — secondary or informational tags (e.g. format, language).
 * - `"gray"` — inactive, disabled, or "not available" states.
 *
 * **Size guide:**
 * - `"md"` (default) — standard size for genre tags in card layouts.
 * - `"sm"` — compact size for dense lists of accessibility/feature tags.
 *
 * **When NOT to use:**
 * - For interactive toggles — use `Chip` instead.
 * - For status indicators with additional context — use `EmptyState` or
 *   inline `<span>` with custom styling.
 */
const meta = {
  title: "Components/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    color: {
      control: "select",
      options: ["pink", "blue", "gray"],
    },
    size: {
      control: "select",
      options: ["md", "sm"],
    },
    href: {
      control: "text",
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pink genre tag — the default used on movie cards. */
export const Pink: Story = {
  args: { children: "Drama", color: "pink" },
};

/** Blue informational tag. */
export const Blue: Story = {
  args: { children: "Subtitled", color: "blue" },
};

/** Gray inactive tag for unavailable or disabled states. */
export const Gray: Story = {
  args: { children: "No listings", color: "gray" },
};

/** Small size tag used in dense accessibility feature lists. */
export const Small: Story = {
  args: { children: "Audio Described", color: "blue", size: "sm" },
};

/**
 * Linked tag — passing `href` renders the pill as an internal link (e.g. a
 * genre tag on a movie page pointing at its genre landing page). Keeps the pill
 * look with no underline and a subtle hover.
 */
export const Link: Story = {
  args: { children: "Horror", color: "pink", href: "/genres/horror" },
};

/** Multiple tags shown together as they appear on a movie card. */
export const TagGroup: Story = {
  args: { children: "Drama" },
  render: () => (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Tag color="pink">Drama</Tag>
      <Tag color="pink">Thriller</Tag>
      <Tag color="blue">Subtitled</Tag>
      <Tag color="gray">No listings</Tag>
    </div>
  ),
};

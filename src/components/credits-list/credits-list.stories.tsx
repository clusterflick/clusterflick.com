import type { Meta, StoryObj } from "@storybook/react";
import CreditsList from "@/components/credits-list";

/**
 * `CreditsList` renders a labelled list of names for a single creative role
 * (e.g. "Director", "Cast"). When `maxDisplay` is set and the list is longer,
 * a "+N more" link truncates the list; tapping it expands inline.
 *
 * **When to use:**
 * - Movie detail pages for directors, cast, writers, and other crew credits.
 *
 * **When NOT to use:**
 * - For navigation links — use `LinkedList`.
 * - For a single credit — render it inline rather than as a list.
 */
const meta = {
  title: "Components/CreditsList",
  component: CreditsList,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CreditsList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Single-name credit — no expand/collapse needed. */
export const Single: Story = {
  args: {
    role: "Director",
    names: ["Christopher Nolan"],
  },
};

/** Short list where all names fit without truncation. */
export const Short: Story = {
  args: {
    role: "Writers",
    names: ["Christopher Nolan", "Jonathan Nolan"],
  },
};

/** Long cast list truncated to the first 4 names. Click "+3 more" to expand. */
export const Truncated: Story = {
  args: {
    role: "Cast",
    names: [
      "Cillian Murphy",
      "Emily Blunt",
      "Matt Damon",
      "Robert Downey Jr.",
      "Florence Pugh",
      "Josh Hartnett",
      "Casey Affleck",
    ],
    maxDisplay: 4,
  },
};

/** Full cast list with no truncation, even with many names. */
export const Long: Story = {
  args: {
    role: "Cast",
    names: [
      "Cillian Murphy",
      "Emily Blunt",
      "Matt Damon",
      "Robert Downey Jr.",
      "Florence Pugh",
      "Josh Hartnett",
      "Casey Affleck",
      "Tom Conti",
      "Alden Ehrenreich",
      "David Krumholtz",
    ],
  },
};

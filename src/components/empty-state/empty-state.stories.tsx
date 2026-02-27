import type { Meta, StoryObj } from "@storybook/react";
import EmptyState from "@/components/empty-state";
import { ButtonLink } from "@/components/button";

/**
 * `EmptyState` displays a "no results" or "nothing here yet" message with an
 * icon, a primary message, and optional hint text and action buttons.
 *
 * **Variants:**
 * - `"contained"` (default) — compact card with a gradient background, for
 *   use inside a content section (e.g. "no festivals currently showing" within
 *   the festivals listing).
 * - `"fullscreen"` — takes up the full viewport height with no background
 *   fill, for page-level empty states where nothing else is shown (e.g. a
 *   failed data load).
 *
 * **When to use:**
 * - When a list, grid, or filtered view returns zero results.
 * - When an async data load fails and there is nothing to render.
 *
 * **When NOT to use:**
 * - For loading states — use `LoadingIndicator` or `Spinner`.
 * - For inline micro-copy like "(none)" inside a table cell — plain text is
 *   more appropriate there.
 */
const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["contained", "fullscreen"],
    },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Contained empty state as used inside the festivals listing when no festivals
 * are currently running.
 */
export const Contained: Story = {
  args: {
    icon: {
      src: "/images/icons/neon-ticket-ripped.svg",
      width: 120,
      height: 80,
    },
    message: "No festivals currently showing",
    hint: "Check back soon — festival listings are updated regularly",
    variant: "contained",
  },
};

/**
 * Fullscreen empty state for page-level errors or zero-data situations where
 * the entire page has nothing to show.
 */
export const Fullscreen: Story = {
  args: {
    icon: {
      src: "/images/icons/neon-ticket-ripped.svg",
      width: 120,
      height: 80,
    },
    title: "No results found",
    message: "We couldn't find any films matching your filters.",
    hint: "Try adjusting your filters to see more results.",
    variant: "fullscreen",
    actions: (
      <ButtonLink href="/" variant="secondary">
        Clear all filters
      </ButtonLink>
    ),
  },
};

/** Empty state with a title heading for more prominent messaging. */
export const WithTitle: Story = {
  args: {
    icon: {
      src: "/images/icons/neon-ticket-ripped.svg",
      width: 120,
      height: 80,
    },
    title: "Nothing here yet",
    message: "This venue has no upcoming screenings listed.",
    variant: "contained",
  },
};

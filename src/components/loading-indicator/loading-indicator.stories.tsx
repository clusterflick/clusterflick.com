import type { Meta, StoryObj } from "@storybook/react";
import LoadingIndicator from "@/components/loading-indicator";

/**
 * `LoadingIndicator` combines a `Spinner` with an accessible `role="status"`
 * container and an optional text message. Use it for any loading state that
 * needs a spinner + descriptive label.
 *
 * **When to use:**
 * - Async data fetching (cinema data, film listings).
 * - Any state where the user is waiting for content to appear.
 *
 * **When NOT to use:**
 * - For a bare spinner without text (e.g. inline next to a button) — use
 *   `Spinner` directly.
 * - For zero-results / error states — use `EmptyState`.
 */
const meta = {
  title: "Components/LoadingIndicator",
  component: LoadingIndicator,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: 'Controls spinner size and spacing. Defaults to "md".',
    },
  },
} satisfies Meta<typeof LoadingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default medium loading indicator — used for most loading states. */
export const Default: Story = {
  args: {
    message: "Loading...",
  },
};

/** Small size for compact loading states within a section or panel. */
export const Small: Story = {
  args: {
    size: "sm",
    message: "Fetching data...",
  },
};

/** Large size for full-page loading states. */
export const Large: Story = {
  args: {
    size: "lg",
    message: "Loading cinema data...",
  },
};

/** Custom message to describe what is loading. */
export const CustomMessage: Story = {
  args: {
    message: "Finding films near you...",
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import DataLoadNotice from "@/components/data-load-notice";

/**
 * `DataLoadNotice` says that part of the listings failed to load, with a way
 * to fetch it again. It is pinned to the foot of the viewport.
 *
 * **When to use:** some movie chunks failed every retry while the rest loaded.
 * `DataLoadNoticeClient` in the root layout shows it from the cinema data
 * context's `failedFiles`, so pages don't place it themselves.
 *
 * **When NOT to use:**
 * - Nothing loaded at all — that is the page's `EmptyState` error with its own
 *   Try Again, since there is no partial page to sit on top of.
 * - Errors outside the listings data (sign-in, TMDB search): those belong
 *   beside the control that failed.
 *
 * Without it a partial failure looks like an answer: films in the missing
 * chunk simply read as not showing.
 */
const meta = {
  title: "Components/DataLoadNotice",
  component: DataLoadNotice,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: {
    onRetry: fn(),
    onDismiss: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataLoadNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shown once a chunk has failed every retry. */
export const Default: Story = {};

/** While "Try again" refetches the failed chunks. */
export const Retrying: Story = {
  args: { isRetrying: true },
};

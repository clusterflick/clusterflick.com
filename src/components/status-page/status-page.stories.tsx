import type { Meta, StoryObj } from "@storybook/react";
import StatusPage, { StatusPageLoading } from "@/components/status-page";
import { ButtonLink } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { emptyHandlers } from "../../../.storybook/msw/handlers";

/**
 * `StatusPage` is a reusable full-page layout for error, not-found, and similar
 * status states. It renders a centred icon, title, message, and optional action
 * buttons over the site's gradient background.
 *
 * `StatusPageLoading` is a minimal variant that wraps a loading indicator in
 * the same layout without the icon/text structure — used while async data is
 * being fetched before the page can render.
 *
 * **When to use:**
 * - 404 and other error pages.
 * - Pages that require async data where a "loading" state must be shown before
 *   the real content appears.
 *
 * **When NOT to use:**
 * - For inline empty states within a page section — use `EmptyState`.
 */
const meta = {
  title: "Components/StatusPage",
  component: StatusPage,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    msw: { handlers: emptyHandlers },
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <CinemaDataProvider>
        <Story />
      </CinemaDataProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof StatusPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 404-style not-found page with a back link. */
export const NotFound: Story = {
  args: {
    iconSrc: "/images/icons/neon-ticket-ripped.svg",
    iconSize: { width: 180, height: 120 },
    title: "Page not found",
    message: "We couldn't find the page you were looking for.",
    backLink: { url: "/", text: "Back to home" },
  },
};

/** Status page with action buttons — e.g. after a failed data load. */
export const WithActions: Story = {
  args: {
    iconSrc: "/images/icons/neon-ticket-ripped.svg",
    iconSize: { width: 180, height: 120 },
    title: "Something went wrong",
    message:
      "We couldn't load the film data. Try refreshing the page or come back later.",
    actions: (
      <ButtonLink href="/" variant="primary">
        Return to home
      </ButtonLink>
    ),
  },
};

/** Status page without a back link — used for top-level error pages. */
export const NoBackLink: Story = {
  args: {
    iconSrc: "/images/icons/neon-ticket-ripped.svg",
    iconSize: { width: 180, height: 120 },
    title: "No results",
    message: "There are no screenings matching your current filters.",
  },
};

/**
 * Loading variant — shown while async page data is being fetched. Uses
 * `StatusPageLoading` rather than the main `StatusPage` component.
 */
export const Loading: Story = {
  args: { iconSrc: "", title: "", message: null },
  render: () => (
    <StatusPageLoading>
      <LoadingIndicator message="Loading cinema data..." size="lg" />
    </StatusPageLoading>
  ),
};

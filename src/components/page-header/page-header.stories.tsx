import type { Meta, StoryObj } from "@storybook/react";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import PageHeader from "@/components/page-header";
import { handlers } from "../../../.storybook/msw/handlers";

/**
 * `PageHeader` renders the back-navigation bar shown at the top of every
 * sub-page (Venue Detail, Festival Detail, About, etc.). It contains an arrow
 * back link and the Clusterflick icon, which spins while data is loading.
 *
 * **Smart back navigation:** If the user arrived via an in-app link (main nav
 * or an internal card), a `useBrowserBack` flag is set in `sessionStorage`.
 * `PageHeader` reads this flag and calls `router.back()` instead of
 * navigating to `backUrl`, preserving scroll position and filter state on
 * the home page.
 *
 * **When to use:**
 * - At the top of every sub-page that has a clear parent destination.
 * - Always pair with `HeroSection` — `PageHeader` sits above the hero.
 *
 * **When NOT to use:**
 * - On the home page — it has its own `MainHeader`.
 * - Do not render more than one `PageHeader` per page.
 */
const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  decorators: [
    (Story) => (
      <CinemaDataProvider>
        <FilterConfigProvider>
          <Story />
        </FilterConfigProvider>
      </CinemaDataProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    msw: { handlers },
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Back to home — the most common usage on venue/festival/movie detail pages. */
export const BackToHome: Story = {
  args: {
    backUrl: "/",
    backText: "Back to film list",
  },
};

/** Back to a parent listing page, as on the borough detail page. */
export const BackToListing: Story = {
  args: {
    backUrl: "/london-cinemas",
    backText: "All boroughs",
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import AboutPageContent from "@/app/about/about-page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";

const meta = {
  title: "Pages/About",
  component: AboutPageContent,
  // The page header reads the cinema data context, as on every page.
  decorators: [
    (Story) => (
      <CinemaDataProvider>
        <FilterConfigProvider>
          <GeolocationProvider>
            <Story />
          </GeolocationProvider>
        </FilterConfigProvider>
      </CinemaDataProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof AboutPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The about page with its Status figures, which are counted at build time and
 * so arrive with the page rather than loading in.
 */
export const Default: Story = {
  args: {
    stats: {
      generatedAt: "2026-11-05T08:21:00.000Z",
      venues: { active: 294, total: 511 },
      sources: [
        { source: "bfi.org.uk", count: 412 },
        { source: "dice.fm", count: 88 },
        { source: "eventbrite.co.uk", count: 156 },
      ],
      events: 1872,
      showings: 46778,
    },
  },
};

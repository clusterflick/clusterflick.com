import type { Meta, StoryObj } from "@storybook/react";
import AboutPage from "@/app/about/page";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

// Wrapper that provides all required contexts (using real providers)
function AboutPageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <AboutPage />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/About",
  component: AboutPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof AboutPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * About page with statistics still loading.
 * The hero and content sections are visible, but stat cards
 * show loading spinners.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * About page fully loaded with all statistics displayed.
 * Shows venue count, event count, and showing totals from real data.
 */
export const FullyLoaded: Story = {
  parameters: {
    msw: {
      handlers, // Pass through to real data files
    },
  },
};

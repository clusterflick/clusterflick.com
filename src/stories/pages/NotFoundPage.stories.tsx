import type { Meta, StoryObj } from "@storybook/react";
import NotFound from "@/app/not-found";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";

// Wrapper that provides all required contexts
function NotFoundPageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <NotFound />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Not Found",
  component: NotFoundPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/some-invalid-path",
      },
    },
  },
} satisfies Meta<typeof NotFoundPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard 404 page shown when a route doesn't exist.
 * Displays a friendly message with a link back to the home page.
 */
export const Default: Story = {};

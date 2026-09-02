import type { Meta, StoryObj } from "@storybook/react";
import DataLicencePage from "@/app/data-licence/page";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { handlers } from "../../../.storybook/msw/handlers";

// The page itself is static prose, but PageHeader reads the cinema data
// context, so the real providers still have to be in place.
function DataLicencePageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <DataLicencePage />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Data Licence",
  component: DataLicencePageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof DataLicencePageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The licence terms as a reader sees them: what the CC BY 4.0 grant covers,
 * the attribution snippets to copy, the TMDB carve-out, and the pipeline
 * repositories that are published but not offered for reuse.
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

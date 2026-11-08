import type { Meta, StoryObj } from "@storybook/react";
import DatasetsPageContent from "@/app/datasets/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { getStoryReleaseStatus } from "../utils/release-status-fixture";
import { handlers } from "../../../.storybook/msw/handlers";

// The page is static prose plus a freshness line, but PageHeader reads the
// cinema data context, so the real providers still have to be in place.
function DatasetsPageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <DatasetsPageContent
            status={getStoryReleaseStatus(new Date().toISOString())}
            latestUrl={null}
          />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Datasets",
  component: DatasetsPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    // The freshness line is relative to the reader's clock
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof DatasetsPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What the published datasets are, where they live, the schema, how often
 * they change, and how to poll latest.json for new data.
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import DataStatusPageContent from "@/app/datasets/status/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { getStoryReleaseStatus } from "../utils/release-status-fixture";
import { handlers } from "../../../.storybook/msw/handlers";

function DataStatusPageWrapper({
  hoursSinceBuild,
}: {
  hoursSinceBuild: number;
}) {
  const [builtAt] = useState(
    () => new Date(Date.now() - hoursSinceBuild * 3_600_000),
  );
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <DataStatusPageContent
            status={getStoryReleaseStatus(builtAt.toISOString())}
            latestUrl={null}
          />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Data Status",
  component: DataStatusPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    // Drawn against the reader's clock, so it changes by the hour
    chromatic: { disableSnapshot: true },
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof DataStatusPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Built an hour ago from a pipeline that is still releasing. */
export const Default: Story = {
  args: { hoursSinceBuild: 1 },
};

/**
 * The last build was three days ago and nothing has been released since:
 * the freshness line turns into a warning, the last three days show as
 * missing, and the current streak ends.
 */
export const Stopped: Story = {
  args: { hoursSinceBuild: 72 },
};

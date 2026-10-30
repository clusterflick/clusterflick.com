import type { Meta, StoryObj } from "@storybook/react";
import BotPage from "@/app/bot/page";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { handlers } from "../../../.storybook/msw/handlers";

// The page itself is static prose, but PageHeader reads the cinema data
// context, so the real providers still have to be in place.
function BotPageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <BotPage />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Bot",
  component: BotPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof BotPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The page venue staff land on after spotting the scraper in their logs:
 * what it collects, what happens to it, how it behaves and who to contact.
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};

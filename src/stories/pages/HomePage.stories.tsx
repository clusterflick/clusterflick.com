import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import PageContent from "@/app/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import {
  FilterConfigProvider,
  useFilterConfig,
} from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import {
  handlers,
  loadingHandlers,
  errorHandlers,
  emptyHandlers,
  partialHandlers,
} from "../../../.storybook/msw/handlers";

// Wrapper that provides all required contexts (using real providers)
function HomePageWrapper() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <PageContent />
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

// Component that applies a non-matching search filter
function ApplyNoMatchFilter({ children }: { children: React.ReactNode }) {
  const { setSearchQuery } = useFilterConfig();

  useEffect(() => {
    // Apply a search query that won't match any movie
    setSearchQuery("xyznonexistentmovie12345");
  }, [setSearchQuery]);

  return <>{children}</>;
}

// Wrapper with filter that matches nothing
function HomePageWithNoMatchingFilter() {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <ApplyNoMatchFilter>
            <PageContent />
          </ApplyNoMatchFilter>
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

const meta = {
  title: "Pages/Home",
  component: HomePageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof HomePageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The home page in a loading state, showing the loading indicator
 * while movies are being fetched.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * The home page with partial data loaded - showing some movies
 * while more are still being fetched.
 */
export const PartialData: Story = {
  parameters: {
    msw: {
      handlers: partialHandlers,
    },
  },
};

/**
 * The home page fully loaded with all movies displayed.
 * This is the default happy path state using real data.
 */
export const FullyLoaded: Story = {
  parameters: {
    msw: {
      handlers, // Pass through to real data files
    },
  },
};

/**
 * The home page with an error state, showing the error message
 * and retry button.
 */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: errorHandlers,
    },
  },
};

/**
 * The home page with no results (empty data from server).
 */
export const EmptyData: Story = {
  parameters: {
    msw: {
      handlers: emptyHandlers,
    },
  },
};

/**
 * The home page with data loaded but filters applied that match nothing.
 * Shows the "No events found" message with suggestion to adjust filters.
 */
export const NoFilterResults: Story = {
  render: () => <HomePageWithNoMatchingFilter />,
  parameters: {
    msw: {
      handlers, // Load real data, but filter will exclude everything
    },
  },
};

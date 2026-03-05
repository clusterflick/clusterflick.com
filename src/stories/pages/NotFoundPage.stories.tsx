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
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof NotFoundPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Generic 404 — shown for any path that doesn't match a known section. */
export const Generic: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/some-invalid-path" } },
  },
};

/** Shown when a /movies/ URL can't be resolved to a film. */
export const Movie: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/movies/tt9999999/some-old-slug" } },
  },
};

/** Shown when a /festivals/ URL doesn't match any festival. */
export const Festival: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/festivals/unknown-festival" } },
  },
};

/** Shown when a /film-clubs/ URL doesn't match any film club. */
export const FilmClub: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/film-clubs/unknown-club" } },
  },
};

/** Shown when a /london-cinemas/ or /venues/ URL doesn't match any cinema. */
export const Venue: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/london-cinemas/unknown-cinema" } },
  },
};

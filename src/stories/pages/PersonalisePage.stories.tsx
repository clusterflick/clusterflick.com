import type { Meta, StoryObj } from "@storybook/react";
import PersonalisePageContent from "@/app/personalise/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";

function PersonalisePageWrapper({ user }: { user: Partial<UserContextType> }) {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <MockUserProvider value={user}>
            <PersonalisePageContent />
          </MockUserProvider>
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

/**
 * The personalisation page: sign-in (which is also sign-up — magic links make
 * them one action) when signed out, and the user's lists when signed in. The
 * user context is mocked, so these stories never touch Firebase.
 */
const meta = {
  title: "Pages/Personalise",
  component: PersonalisePageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof PersonalisePageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  args: { user: { status: "signed-out" } },
};

export const SignedInEmpty: Story = {
  args: {
    user: {
      status: "signed-in",
      email: "reader@example.com",
      lists: { [UserListId.Watchlist]: {}, [UserListId.Seen]: {} },
    },
  },
};

export const SignedInWithLists: Story = {
  args: {
    user: {
      status: "signed-in",
      email: "reader@example.com",
      lists: {
        [UserListId.Watchlist]: {
          "843": {
            title: "In the Mood for Love",
            year: "2000",
            addedAt: 1_758_000_000_000,
          },
          "11216": {
            title: "Cinema Paradiso",
            year: "1988",
            addedAt: 1_758_100_000_000,
          },
        },
        [UserListId.Seen]: {
          "129": {
            title: "Spirited Away",
            year: "2001",
            addedAt: 1_757_000_000_000,
          },
        },
      },
    },
  },
};

export const Unavailable: Story = {
  args: { user: { status: "unavailable" } },
};

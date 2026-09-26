import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { within, userEvent } from "storybook/test";
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

/** The list tools opened from the account bar, with Remove buttons shown. */
export const SignedInManagingLists: Story = {
  args: SignedInWithLists.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Manage lists" }),
    );
    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Show Remove buttons on your lists",
      }),
    );
  },
};

/**
 * TMDB search results, as the Worker at /api/tmdb returns them. Against the
 * current data the first two are showing, so they link to their pages; the
 * last isn't, and has no poster.
 */
const searchResults = {
  page: 1,
  totalPages: 1,
  totalResults: 3,
  results: [
    {
      id: "843",
      title: "In the Mood for Love",
      year: "2000",
      releaseDate: "2000-05-22",
      posterPath: "/8BgGbbWiLNhPtkMkN0gGTnbtvBv.jpg",
    },
    {
      id: "42269",
      title: "We All Loved Each Other So Much",
      originalTitle: "C'eravamo tanto amati",
      year: "1974",
      releaseDate: "1974-12-21",
      posterPath: "/zGGWYpiKNwjpKxelPxOMqJnUgDs.jpg",
    },
    { id: "8051", title: "Punch-Drunk Love", year: "2002" },
  ],
};

/** Adding a film that isn't showing, found through the TMDB search. */
export const SignedInSearching: Story = {
  args: SignedInWithLists.args,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/tmdb/search", () => HttpResponse.json(searchResults)),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("textbox", { name: "Film title" }),
      "love{enter}",
    );
    await canvas.findByRole("heading", { name: "Punch-Drunk Love" });
  },
};

/** The Worker's rate limit reached. */
export const SignedInSearchRateLimited: Story = {
  args: SignedInEmpty.args,
  parameters: {
    msw: {
      handlers: [
        http.get(
          "/api/tmdb/search",
          () => new HttpResponse(null, { status: 429 }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("textbox", { name: "Film title" }),
      "dune",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Search" }));
    await canvas.findByRole("alert");
  },
};

export const Unavailable: Story = {
  args: { user: { status: "unavailable" } },
};

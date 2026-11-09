import type { Meta, StoryObj } from "@storybook/react";
import ListProgress from "@/components/list-progress";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { UserListId, type UserListEntry } from "@/lib/user-lists";

const IDS = Array.from({ length: 250 }, (_, i) => String(i + 1));
const entry: UserListEntry = { title: "A film", addedAt: 0 };
const seen = (count: number) =>
  Object.fromEntries(IDS.slice(0, count).map((id) => [id, entry]));

const signedIn = (count: number): Partial<UserContextType> => ({
  status: "signed-in",
  lists: { [UserListId.Watchlist]: {}, [UserListId.Seen]: seen(count) },
});

/**
 * `ListProgress` shows how far through a film list the signed-in reader is,
 * from their Seen list.
 *
 * **When to use:** on a list's card (`ring`) or its own page (`line`).
 * Pass the list's TMDB ids from the build (`getMovieListTmdbIds`).
 *
 * **When not to use:** for a computed list, which has no fixed membership to
 * be through. It renders nothing signed out, so static pages are unchanged.
 */
const meta = {
  title: "Components/ListProgress",
  component: ListProgress,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
    nextjs: { appDirectory: true },
  },
  args: { tmdbIds: IDS },
  decorators: [
    (Story, { parameters }) => (
      <MockUserProvider value={parameters.user ?? signedIn(112)}>
        <Story />
      </MockUserProvider>
    ),
  ],
} satisfies Meta<typeof ListProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ring: Story = {};

export const RingNoneSeen: Story = { parameters: { user: signedIn(0) } };

export const RingComplete: Story = { parameters: { user: signedIn(250) } };

export const Line: Story = {
  args: { variant: "line", showingIds: ["200", "201", "202", "203", "1"] },
};

export const LineComplete: Story = {
  args: { variant: "line" },
  parameters: { user: signedIn(250) },
};

/** Signed out it renders nothing. */
export const SignedOut: Story = {
  parameters: { user: { status: "signed-out" } },
};

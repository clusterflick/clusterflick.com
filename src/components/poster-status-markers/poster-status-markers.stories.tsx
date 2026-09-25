import type { Meta, StoryObj } from "@storybook/react";
import PosterStatusMarkers from "@/components/poster-status-markers";
import MoviePoster from "@/components/movie-poster";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { UserListId, type UserListEntry } from "@/lib/user-lists";

const movie = {
  id: "843",
  title: "In the Mood for Love",
  year: "2000",
};

const entry: UserListEntry = {
  title: movie.title,
  year: movie.year,
  addedAt: 1_758_000_000_000,
};

function Wrapper({ user }: { user: Partial<UserContextType> }) {
  return (
    <MockUserProvider value={user}>
      {/* A positioned link, as the grids wrap each poster. */}
      <a
        href="#"
        style={{
          position: "relative",
          display: "block",
          width: 200,
          borderBottom: "none",
        }}
      >
        <PosterStatusMarkers movieId={movie.id} />
        <MoviePoster title={movie.title} subtitle={movie.year} showOverlay />
      </a>
    </MockUserProvider>
  );
}

function signedInWith(lists: UserListId[]): Partial<UserContextType> {
  return {
    status: "signed-in",
    lists: {
      [UserListId.Watchlist]: lists.includes(UserListId.Watchlist)
        ? { [movie.id]: entry }
        : {},
      [UserListId.Seen]: lists.includes(UserListId.Seen)
        ? { [movie.id]: entry }
        : {},
    },
  };
}

/**
 * `PosterStatusMarkers` marks a poster with the reader's own status on the
 * film — on their watchlist, seen — as small discs in the top-right corner.
 * Several overlap like a pile of chips and fan out when the poster's link is
 * hovered or focused (always fanned out on touch screens).
 *
 * **When to use:**
 * - On posters in a browsing grid (`FilmPosterGrid`, `MovieCell`), so a
 *   signed-in reader can see at a glance what they've saved or seen.
 *
 * **When NOT to use:**
 * - To change a list. These are indicators only; `UserListButtons` on the
 *   film's page is where lists are edited.
 * - On `/personalise`, where every poster is on the list being shown.
 *
 * **Behaviour:**
 * - Renders nothing unless signed in with lists loaded.
 * - Must be a direct child of a positioned link or tile; `--status-markers-top`
 *   on that parent moves it down (below a notice bar, say).
 */
const meta = {
  title: "Components/PosterStatusMarkers",
  component: Wrapper,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Wrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On the watchlist. */
export const Watchlist: Story = {
  args: { user: signedInWith([UserListId.Watchlist]) },
};

/** Seen. */
export const Seen: Story = {
  args: { user: signedInWith([UserListId.Seen]) },
};

/** Seen and back on the watchlist: stacked, fanning out on hover. */
export const Both: Story = {
  args: { user: signedInWith([UserListId.Watchlist, UserListId.Seen]) },
};

/** Signed out: nothing is drawn. */
export const SignedOut: Story = {
  args: { user: { status: "signed-out" } },
};

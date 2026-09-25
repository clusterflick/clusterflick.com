import type { Meta, StoryObj } from "@storybook/react";
import UserListButtons from "@/components/user-list-buttons";
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
      {/* The width of the film page's poster column, which they fill. */}
      <div style={{ width: 308 }}>
        <UserListButtons movie={movie} />
      </div>
    </MockUserProvider>
  );
}

/**
 * `UserListButtons` puts a film on the reader's watchlist ("Want to see") or
 * seen list ("Seen it"). It reads the user from `UserProvider`.
 *
 * **When to use:**
 * - Under the poster on a film's own page, where the reader has decided about
 *   one film.
 *
 * **When NOT to use:**
 * - On posters in a grid. Grids show status with `PosterStatusMarkers`;
 *   lists are changed on the film's own page.
 *
 * **Behaviour:**
 * - Signed out (or while the sign-in state is being checked), both buttons
 *   link to `/personalise`, so they double as the way into personalisation.
 * - Signed in, they're toggle buttons with `aria-pressed`. Marking a film
 *   seen takes it off the watchlist.
 * - With no Firebase config in the build, nothing renders.
 */
const meta = {
  title: "Components/UserListButtons",
  component: Wrapper,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Wrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Links to `/personalise`, for a reader who isn't signed in. */
export const SignedOut: Story = {
  args: { user: { status: "signed-out" } },
};

/** Signed in, with the film on neither list. */
export const SignedIn: Story = {
  args: {
    user: {
      status: "signed-in",
      lists: { [UserListId.Watchlist]: {}, [UserListId.Seen]: {} },
    },
  },
};

/** The film is on the watchlist. */
export const OnWatchlist: Story = {
  args: {
    user: {
      status: "signed-in",
      lists: {
        [UserListId.Watchlist]: { [movie.id]: entry },
        [UserListId.Seen]: {},
      },
    },
  },
};

/** The film has been seen. */
export const Seen: Story = {
  args: {
    user: {
      status: "signed-in",
      lists: {
        [UserListId.Watchlist]: {},
        [UserListId.Seen]: { [movie.id]: entry },
      },
    },
  },
};

/** Signed in but the lists haven't loaded, so the buttons are disabled. */
export const ListsLoading: Story = {
  args: { user: { status: "signed-in", lists: null } },
};

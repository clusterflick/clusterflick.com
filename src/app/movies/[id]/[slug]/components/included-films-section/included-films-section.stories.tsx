import type { Meta, StoryObj } from "@storybook/react";
import type { Movie } from "@clusterflick/catalogue/types";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { UserListId, type UserListEntry } from "@/lib/user-lists";
import IncludedFilmsSection from "./index";

const event: Pick<Movie, "id" | "includedMovies"> = {
  id: "ddb74a6f",
  includedMovies: [
    { id: "76", title: "Before Sunrise", year: "1995", duration: 6060000 },
    { id: "80", title: "Before Sunset", year: "2004", duration: 4800000 },
    { id: "132344", title: "Before Midnight", year: "2013", duration: 6540000 },
  ],
};

function entry(id: string): UserListEntry {
  const film = event.includedMovies!.find((movie) => movie.id === id)!;
  return { title: film.title, year: film.year, addedAt: 1_758_000_000_000 };
}

const signedIn: Partial<UserContextType> = {
  status: "signed-in",
  lists: {
    [UserListId.Seen]: { "76": entry("76"), "80": entry("80") },
    [UserListId.Watchlist]: { "132344": entry("132344") },
  },
};

function Wrapper({
  user,
  inline,
}: {
  user: Partial<UserContextType>;
  inline: boolean;
}) {
  return (
    <MockUserProvider value={user}>
      <IncludedFilmsSection event={event} allMovies={{}} inline={inline} />
    </MockUserProvider>
  );
}

/**
 * `IncludedFilmsSection` lists the films a multi-film event (a double bill,
 * marathon, all-nighter) screens, on the event's own film page.
 *
 * **When to use:**
 * - On a film page whose listing has `includedMovies`.
 *
 * **When NOT to use:**
 * - To say which events a film is part of: that's `PartOfSection`.
 *
 * **Behaviour:**
 * - For a signed-in reader, each poster carries `PosterStatusMarkers` (seen,
 *   on their watchlist) and the heading says how many of the films they've
 *   seen. Signed out, neither renders, so the static page is unchanged.
 */
const meta = {
  title: "Components/IncludedFilmsSection",
  component: Wrapper,
  parameters: { backgrounds: { default: "dark" } },
  tags: ["autodocs"],
  args: { user: { status: "signed-out" }, inline: true },
} satisfies Meta<typeof Wrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed out: the films alone, as the static page renders them. */
export const SignedOut: Story = {};

/** Two of the three seen, the third on the watchlist. */
export const SignedIn: Story = { args: { user: signedIn } };

/** Rendered as its own section rather than in the film page's hero. */
export const SignedInSection: Story = {
  args: { user: signedIn, inline: false },
};

import type { Meta, StoryObj } from "@storybook/react";
import FavouriteVenueButton from "@/components/favourite-venue-button";
import { MockUserProvider, type UserContextType } from "@/state/user-context";

const venue = { id: "prince-charles-cinema", name: "Prince Charles Cinema" };

function Wrapper({ user }: { user: Partial<UserContextType> }) {
  return (
    <MockUserProvider value={user}>
      <FavouriteVenueButton venue={venue} />
    </MockUserProvider>
  );
}

/**
 * `FavouriteVenueButton` adds a venue to the reader's "My Venues", which the
 * filter overlay offers as a one-tap venue preset. It reads the user from
 * `UserProvider`.
 *
 * **When to use:**
 * - In a venue page's hero, where the reader has decided about one venue.
 *
 * **When NOT to use:**
 * - In venue pickers (the overlay's quick-add, the map). Those choose venues
 *   for the current search; starring is a standing choice made on the venue.
 * - For films — that is `UserListButtons`.
 *
 * **Behaviour:**
 * - Signed out (or while the sign-in state is being checked), it links to
 *   `/personalise`.
 * - Signed in, it's a toggle button with `aria-pressed`, yellow when on.
 * - With no Firebase config in the build, nothing renders.
 */
const meta = {
  title: "Components/FavouriteVenueButton",
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

/** Signed in, and the venue isn't one of theirs. */
export const SignedIn: Story = {
  args: { user: { status: "signed-in", favouriteVenues: {} } },
};

/** The venue is in My Venues. */
export const Favourite: Story = {
  args: {
    user: {
      status: "signed-in",
      favouriteVenues: {
        [venue.id]: { name: venue.name, addedAt: 1_758_000_000_000 },
      },
    },
  },
};

/** Signed in but the lists haven't loaded, so the button is disabled. */
export const Loading: Story = {
  args: { user: { status: "signed-in", favouriteVenues: null } },
};

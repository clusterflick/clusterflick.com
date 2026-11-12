import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { ProfilePage } from "@/app/profile-shell/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import { UserListId } from "@/lib/user-lists";
import type { FilmDetails } from "@/lib/user-lists/film-details";
import type { ProfilePageData } from "@/lib/user-profile/page-data";

function ProfilePageWrapper({
  data,
  user,
}: {
  data: ProfilePageData;
  user: Partial<UserContextType>;
}) {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <MockUserProvider value={user}>
            <ProfilePage
              data={data}
              venueImagePaths={{
                "riocinema.org.uk": "/images/venues/riocinema.org.uk.png",
              }}
              movieLists={[
                {
                  id: "hong-kong",
                  name: "Hong Kong Classics",
                  href: "/lists/hong-kong/",
                  imagePath: null,
                  tmdbIds: ["843", "11104", "e"],
                },
              ]}
            />
          </MockUserProvider>
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

/**
 * A reader's public profile, at `/u/<handle>/`. The profiles Worker serves
 * the `/profile-shell/` page with the profile in it; these stories give
 * `ProfilePage` that data directly. Who's looking comes from the user
 * context, which is mocked.
 */
const meta = {
  title: "Pages/Profile",
  component: ProfilePageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof ProfilePageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** [id, title, year, details]: enough Seen films for the stats to show. */
const SEEN_FILMS: [string, string, string, FilmDetails][] = [
  [
    "843",
    "In the Mood for Love",
    "2000",
    {
      genres: ["18", "10749"],
      directors: ["wkw"],
      cast: ["tony"],
      runtime: 98,
      language: "cn",
    },
  ],
  [
    "11104",
    "Chungking Express",
    "1994",
    {
      genres: ["18", "35"],
      directors: ["wkw"],
      cast: ["tony"],
      runtime: 102,
      language: "cn",
    },
  ],
  [
    "129",
    "Spirited Away",
    "2001",
    {
      genres: ["16"],
      directors: ["miyazaki"],
      cast: [],
      runtime: 125,
      language: "ja",
    },
  ],
  [
    "949",
    "Heat",
    "1995",
    {
      genres: ["80"],
      directors: ["mann"],
      cast: ["pacino"],
      runtime: 170,
      language: "en",
    },
  ],
  [
    "1018",
    "Mulholland Drive",
    "2001",
    {
      genres: ["53"],
      directors: ["lynch"],
      cast: [],
      runtime: 147,
      language: "en",
    },
  ],
  [
    "11216",
    "Cinema Paradiso",
    "1988",
    {
      genres: ["18"],
      directors: ["tornatore"],
      cast: [],
      runtime: 155,
      language: "it",
    },
  ],
];

const FOUND: ProfilePageData = {
  found: true,
  handle: "film-fan",
  lists: {
    [UserListId.Seen]: Object.fromEntries(
      SEEN_FILMS.map(([id, title, year], index) => [
        id,
        { title, year, addedAt: 1_757_000_000_000 + index },
      ]),
    ),
    [UserListId.Watchlist]: {
      "496243": { title: "Parasite", year: "2019", addedAt: 1_758_000_000_000 },
      "a-long-gone-film": {
        title: "A Film Long Gone",
        year: "1950",
        addedAt: 1_758_100_000_000,
      },
    },
  },
  favouriteVenues: {
    "riocinema.org.uk": { name: "Rio Cinema", addedAt: 1_758_000_000_000 },
  },
  filmDetails: {
    films: Object.fromEntries(
      SEEN_FILMS.map(([id, , , details]) => [id, details]),
    ),
    people: {
      wkw: "Wong Kar-wai",
      tony: "Tony Leung",
      miyazaki: "Hayao Miyazaki",
      mann: "Michael Mann",
      pacino: "Al Pacino",
      lynch: "David Lynch",
      tornatore: "Giuseppe Tornatore",
    },
  },
};

const SIGNED_IN = {
  status: "signed-in",
  email: "reader@example.com",
} as const;

const GRANTED = async () => ({
  [CapabilityId.PublicProfile]: { grantedAt: 0 },
});

/** A visitor who isn't signed in: the lists, and nothing to edit. */
export const Public: Story = {
  args: { data: FOUND, user: { status: "signed-out" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "film-fan" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("6 films seen, 2 films on the watchlist"),
    ).toBeInTheDocument();
    // /personalise's sections, speaking about the reader, with no editing.
    await expect(
      await canvas.findByRole("heading", { name: "Film Stats" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("heading", { name: /Favourite Venues/ }),
    ).toBeInTheDocument();
    await expect(
      // Once the listings have loaded: it covers only venues still in them.
      await canvas.findByRole("link", { name: "What's on at these venues" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/\byour?\b/i)).not.toBeInTheDocument();
    await expect(canvas.queryByText("Remove")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Edit profile")).not.toBeInTheDocument();
  },
};

/** The owner, signed in: an "Edit profile" link to /personalise. */
export const PublicOwner: Story = {
  args: {
    data: FOUND,
    user: {
      ...SIGNED_IN,
      readProfile: async () => ({ handle: "film-fan", public: true }),
      readCapabilities: GRANTED,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("link", { name: "Edit profile" }),
    ).toHaveAttribute("href", "/personalise/");
  },
};

export const PublicEmptyLists: Story = {
  args: {
    data: {
      found: true,
      handle: "new-reader",
      lists: { [UserListId.Seen]: {}, [UserListId.Watchlist]: {} },
      favouriteVenues: {},
      filmDetails: { films: {}, people: {} },
    },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No prompts to add films: they're for the owner, on /personalise.
    await expect(await canvas.findAllByText("Nothing here yet.")).toHaveLength(
      3,
    );
    await expect(canvas.queryByText(/Film Stats/)).not.toBeInTheDocument();
  },
};

/**
 * Anyone but the owner, when there's no profile, it's private, or its
 * capability was taken away: one message for all three.
 */
export const NotFound: Story = {
  args: {
    data: { found: false, handle: "film-fan" },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("There's no public profile at this address."),
    ).toBeInTheDocument();
  },
};

/** The owner, on their private profile: told why, and where to change it. */
export const NotFoundOwnerPrivate: Story = {
  args: {
    data: { found: false, handle: "film-fan" },
    user: {
      ...SIGNED_IN,
      readProfile: async () => ({ handle: "film-fan", public: false }),
      readCapabilities: GRANTED,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Your Profile Is Private" }),
    ).toBeInTheDocument();
  },
};

/**
 * The owner, whose capability was taken away: the same page as everyone
 * else's, since a revocation isn't explained here.
 */
export const NotFoundOwnerRevoked: Story = {
  args: {
    data: { found: false, handle: "film-fan" },
    user: {
      ...SIGNED_IN,
      readProfile: async () => ({ handle: "film-fan", public: true }),
      readCapabilities: async () => ({}),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("There's no public profile at this address."),
    ).toBeInTheDocument();
  },
};

/** A reader who may have a profile but hasn't set one up. */
export const NotFoundWithoutHandle: Story = {
  args: {
    data: { found: false, handle: "film-fan" },
    user: { ...SIGNED_IN, readCapabilities: GRANTED },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Want one of your own\?/),
    ).toBeInTheDocument();
  },
};

/** A signed-in reader without the capability: profiles are invite-only. */
export const NotFoundWithoutCapability: Story = {
  args: {
    data: { found: false, handle: "film-fan" },
    user: SIGNED_IN,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("link", { name: "hello@clusterflick.com" }),
    ).toHaveAttribute("href", "mailto:hello@clusterflick.com");
  },
};

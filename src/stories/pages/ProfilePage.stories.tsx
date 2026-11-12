import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { ProfilePage } from "@/app/profile-shell/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import { UserListId } from "@/lib/user-lists";
import type { FilmDetails } from "@/lib/user-lists/film-details";
import type { ProfilePageData } from "@/lib/user-profile/page-data";
import { ALL_PROFILE_SECTIONS, ProfileSectionId } from "@/lib/user-profile";

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
  // The comparison cards' dismissals are kept in the browser, which every
  // story shares: each starts with none.
  beforeEach: () => {
    localStorage.removeItem("clusterflick-profile-sign-up-dismissed");
    localStorage.removeItem("clusterflick-profile-compare-dismissed");
  },
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

const FOUND = {
  found: true,
  handle: "film-fan",
  sections: ALL_PROFILE_SECTIONS,
  links: {},
  favourites: [],
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
} satisfies ProfilePageData;

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
    // Their taste, from the stats: drama the most common genre, half the
    // films from the 2000s, and two by one director.
    await expect(
      await canvas.findByText(
        "Mostly drama · Big on the 2000s · 2 Wong Kar-wai films",
      ),
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
    // The owner's sections speak about them, not to the reader; only the
    // invitation, which is for the visitor, says "you".
    await expect(
      canvas
        .queryAllByText(/\byour?\b/i)
        .filter((element) => !element.closest("aside")),
    ).toEqual([]);
    await expect(canvas.queryByText("Remove")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Edit profile")).not.toBeInTheDocument();
    // Signed out, what they'd have in common is an invitation, which can
    // be dismissed for the day.
    await expect(
      canvas.getByRole("link", { name: "Start your lists" }),
    ).toHaveAttribute("href", "/personalise/");
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss" }));
    await expect(
      canvas.queryByRole("link", { name: "Start your lists" }),
    ).not.toBeInTheDocument();
    await expect(
      localStorage.getItem("clusterflick-profile-sign-up-dismissed"),
    ).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  },
};

const VISITOR = {
  ...SIGNED_IN,
  lists: {
    [UserListId.Watchlist]: {
      "496243": { title: "Parasite", year: "2019", addedAt: 1 },
      "949": { title: "Heat", year: "1995", addedAt: 1 },
    },
    [UserListId.Seen]: {
      "843": { title: "In the Mood for Love", year: "2000", addedAt: 1 },
      "a-long-gone-film": {
        title: "A Film Long Gone",
        year: "1950",
        addedAt: 1,
      },
    },
  },
} satisfies Partial<UserContextType>;

/**
 * Someone else, signed in: a card offering to compare, which opens what they
 * have in common with the owner, a group for each kind of film. Hide brings
 * the card back.
 */
export const VisitorComparing: Story = {
  args: { data: FOUND, user: VISITOR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "You have 4 films in common with film-fan.",
      ),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: "You and film-fan" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Compare" }));
    await expect(
      canvas.getByRole("heading", { name: "You and film-fan" }),
    ).toBeInTheDocument();
    for (const group of [
      /^You both want to see/,
      /^You've both seen/,
      /^On your watchlist, seen by film-fan/,
      /^Seen by you, on film-fan's watchlist/,
    ]) {
      await expect(
        canvas.getByRole("heading", { name: group }),
      ).toBeInTheDocument();
    }
    await userEvent.click(canvas.getByRole("button", { name: "Hide" }));
    await expect(
      canvas.getByRole("button", { name: "Compare" }),
    ).toBeInTheDocument();
  },
};

/** Dismissed, the compare card stays gone for this profile, for the day. */
export const VisitorDismissing: Story = {
  args: { data: FOUND, user: VISITOR },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Dismiss" }),
    );
    await expect(
      canvas.queryByRole("button", { name: "Compare" }),
    ).not.toBeInTheDocument();
    await expect(
      JSON.parse(
        localStorage.getItem("clusterflick-profile-compare-dismissed") ?? "",
      ).handles,
    ).toEqual(["film-fan"]);
  },
};

/** Someone else, signed in, with nothing in common: said, with no button. */
export const VisitorNothingInCommon: Story = {
  args: {
    data: FOUND,
    user: {
      ...SIGNED_IN,
      lists: { [UserListId.Watchlist]: {}, [UserListId.Seen]: {} },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "No films in common with film-fan yet.",
      ),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("button", { name: "Compare" }),
    ).not.toBeInTheDocument();
  },
};

/**
 * Both lists hidden: nothing to compare, so no comparison, even with the
 * Seen list sent for the stats.
 */
export const VisitorListsHidden: Story = {
  args: {
    data: {
      ...FOUND,
      sections: {
        ...ALL_PROFILE_SECTIONS,
        [ProfileSectionId.Watchlist]: false,
        [ProfileSectionId.Seen]: false,
      },
    },
    user: {
      ...SIGNED_IN,
      lists: {
        [UserListId.Watchlist]: {},
        [UserListId.Seen]: {
          "843": { title: "In the Mood for Love", year: "2000", addedAt: 1 },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Film Stats" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/in common with/)).not.toBeInTheDocument();
  },
};

/** The owner, signed in: "Edit profile" and "Copy link" under the hero. */
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
    ).toHaveAttribute("href", "/personalise/profile/");
    await expect(
      canvas.getByRole("button", { name: "Copy link" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/in common with/)).not.toBeInTheDocument();
  },
};

/**
 * Favourite films head the page, fanned over a wash of their posters, in the
 * reader's order: one that's showing links to its page, one that isn't is
 * drawn from its snapshot, unlinked.
 */
export const WithFavourites: Story = {
  args: {
    data: {
      ...FOUND,
      favourites: [
        { id: "949", title: "Heat", year: "1995" },
        { id: "a-long-gone-film", title: "A Film Long Gone", year: "1950" },
        { id: "843", title: "In the Mood for Love", year: "2000" },
      ],
    },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fan = await canvas.findByRole("list", { name: "Favourite films" });
    const posters = within(fan).getAllByRole("listitem");
    await expect(posters).toHaveLength(3);
    // In the reader's order; only what's showing is linked.
    await expect(
      within(posters[0]).getByLabelText("Heat (1995)"),
    ).toBeInTheDocument();
    await expect(
      within(posters[1]).getByLabelText("A Film Long Gone (1950)"),
    ).toBeInTheDocument();
    await expect(
      within(posters[2]).getByLabelText("In the Mood for Love (2000)"),
    ).toBeInTheDocument();
  },
};

/**
 * A name and links: the name heads the page, the handle leads the line under
 * it, and the links open the reader's profiles elsewhere.
 */
export const WithNameAndLinks: Story = {
  args: {
    data: {
      ...FOUND,
      displayName: "Siobhán O'Brien",
      links: {
        letterboxd: "film_fan",
        imdb: "ur1234567",
        website: "https://www.example.com/films",
      },
    },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Siobhán O'Brien" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("@film-fan · 6 films seen, 2 films on the watchlist"),
    ).toBeInTheDocument();
    const letterboxd = canvas.getByRole("link", { name: "Letterboxd" });
    await expect(letterboxd).toHaveAttribute(
      "href",
      "https://letterboxd.com/film_fan/",
    );
    await expect(letterboxd).toHaveAttribute(
      "rel",
      "me ugc nofollow noopener noreferrer",
    );
    await expect(canvas.getByRole("link", { name: "IMDb" })).toHaveAttribute(
      "href",
      "https://www.imdb.com/user/ur1234567/",
    );
    await expect(
      canvas.getByRole("link", { name: "example.com" }),
    ).toHaveAttribute("href", "https://www.example.com/films");
  },
};

/**
 * The stats without the Seen list, and no watchlist or venues: only what was
 * chosen, and the subtitle counts only what's shown.
 */
export const SomeSectionsHidden: Story = {
  args: {
    data: {
      ...FOUND,
      sections: {
        [ProfileSectionId.SeenStats]: true,
        [ProfileSectionId.Watchlist]: false,
        [ProfileSectionId.FavouriteVenues]: false,
        [ProfileSectionId.Seen]: false,
      },
      // A hidden section's data never arrives.
      lists: { ...FOUND.lists, [UserListId.Watchlist]: {} },
      favouriteVenues: {},
    },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Film Stats" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("6 films seen")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: /Watchlist/ }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("heading", { name: /Favourite Venues/ }),
    ).not.toBeInTheDocument();
    // The stats' own headings aside, no list headed Seen.
    await expect(
      canvas.queryByRole("heading", { name: /^Seen/ }),
    ).not.toBeInTheDocument();
  },
};

/** Every section switched off: the handle, and a line saying so. */
export const NothingShown: Story = {
  args: {
    data: {
      found: true,
      handle: "quiet-reader",
      links: {},
      favourites: [],
      sections: {
        [ProfileSectionId.SeenStats]: false,
        [ProfileSectionId.Watchlist]: false,
        [ProfileSectionId.FavouriteVenues]: false,
        [ProfileSectionId.Seen]: false,
      },
      lists: { [UserListId.Seen]: {}, [UserListId.Watchlist]: {} },
      favouriteVenues: {},
      filmDetails: { films: {}, people: {} },
    },
    user: { status: "signed-out" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("quiet-reader isn't sharing any lists yet."),
    ).toBeInTheDocument();
    await expect(canvas.queryByText(/films seen/)).not.toBeInTheDocument();
  },
};

export const PublicEmptyLists: Story = {
  args: {
    data: {
      found: true,
      handle: "new-reader",
      sections: ALL_PROFILE_SECTIONS,
      links: {},
      favourites: [],
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

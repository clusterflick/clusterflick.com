import type { Meta, StoryObj } from "@storybook/react";
import { delay, http, HttpResponse } from "msw";
import { expect, userEvent, waitFor, within } from "storybook/test";
import PersonalisePageContent from "@/app/personalise/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import type { FilmDetails } from "@/lib/user-lists/film-details";

function PersonalisePageWrapper({ user }: { user: Partial<UserContextType> }) {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <MockUserProvider value={user}>
            <PersonalisePageContent
              venueImagePaths={{
                "riocinema.org.uk": "/images/venues/riocinema.org.uk.png",
                "actonecinema.co.uk": "/images/venues/actonecinema.co.uk.jpg",
              }}
            />
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
      favouriteVenues: {},
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
      favouriteVenues: {
        "riocinema.org.uk": { name: "Rio Cinema", addedAt: 1_758_000_000_000 },
        "actonecinema.co.uk": {
          name: "ActOne Cinema",
          addedAt: 1_758_100_000_000,
        },
      },
    },
  },
};

/** Films for the stats story: [id, title, year, details], details omitted for an unmatched film. */
const STATS_FILMS: [string, string, string, FilmDetails?][] = [
  [
    "heat",
    "Heat",
    "1995",
    {
      genres: ["28", "80", "18"],
      directors: ["mann"],
      cast: ["pacino", "deniro"],
      runtime: 170,
      language: "en",
    },
  ],
  [
    "insider",
    "The Insider",
    "1999",
    {
      genres: ["18", "53"],
      directors: ["mann"],
      cast: ["pacino"],
      runtime: 157,
      language: "en",
    },
  ],
  [
    "taxi-driver",
    "Taxi Driver",
    "1976",
    {
      genres: ["80", "18"],
      directors: ["scorsese"],
      cast: ["deniro"],
      runtime: 114,
      language: "en",
    },
  ],
  [
    "mood",
    "In the Mood for Love",
    "2000",
    {
      genres: ["18", "10749"],
      directors: ["wong"],
      cast: ["leung", "cheung"],
      runtime: 98,
      language: "cn",
    },
  ],
  [
    "chungking",
    "Chungking Express",
    "1994",
    {
      genres: ["18", "35", "10749"],
      directors: ["wong"],
      cast: ["leung"],
      runtime: 102,
      language: "cn",
    },
  ],
  [
    "samurai",
    "Seven Samurai",
    "1954",
    {
      genres: ["28", "18"],
      directors: ["kurosawa"],
      cast: ["mifune"],
      runtime: 207,
      language: "ja",
    },
  ],
  [
    "rashomon",
    "Rashomon",
    "1950",
    {
      genres: ["80", "18", "9648"],
      directors: ["kurosawa"],
      cast: ["mifune"],
      runtime: 88,
      language: "ja",
    },
  ],
  [
    "ran",
    "Ran",
    "1985",
    {
      genres: ["28", "18", "10752"],
      directors: ["kurosawa"],
      cast: [],
      runtime: 162,
      language: "ja",
    },
  ],
  [
    "vertigo",
    "Vertigo",
    "1958",
    {
      genres: ["9648", "10749", "53"],
      directors: ["hitchcock"],
      cast: ["stewart"],
      runtime: 128,
      language: "en",
    },
  ],
  [
    "rear-window",
    "Rear Window",
    "1954",
    {
      genres: ["9648", "53"],
      directors: ["hitchcock"],
      cast: ["stewart"],
      runtime: 112,
      language: "en",
    },
  ],
  [
    "metropolis",
    "Metropolis",
    "1927",
    {
      genres: ["18", "878"],
      directors: ["lang"],
      cast: [],
      runtime: 153,
      language: "de",
    },
  ],
  [
    "la-jetee",
    "La Jetée",
    "1962",
    {
      genres: ["878"],
      directors: ["marker"],
      cast: [],
      runtime: 28,
      language: "fr",
    },
  ],
  ["shorts-night", "A Night of Shorts", "2026"],
];

const STATS_PEOPLE: Record<string, string> = {
  mann: "Michael Mann",
  pacino: "Al Pacino",
  deniro: "Robert De Niro",
  scorsese: "Martin Scorsese",
  wong: "Wong Kar-wai",
  leung: "Tony Leung Chiu-wai",
  cheung: "Maggie Cheung",
  kurosawa: "Akira Kurosawa",
  mifune: "Toshiro Mifune",
  hitchcock: "Alfred Hitchcock",
  stewart: "James Stewart",
  lang: "Fritz Lang",
  marker: "Chris Marker",
  coen: "Joel Coen",
  pta: "Paul Thomas Anderson",
  tarantino: "Quentin Tarantino",
};

/** Five films with nothing in common but the decade. */
const SPARSE_FILMS: [string, string, string, FilmDetails][] = [
  [
    "heat",
    "Heat",
    "1995",
    {
      genres: ["80", "18"],
      directors: ["mann"],
      cast: ["pacino"],
      runtime: 170,
      language: "en",
    },
  ],
  [
    "fargo",
    "Fargo",
    "1996",
    {
      genres: ["80", "18"],
      directors: ["coen"],
      cast: [],
      runtime: 98,
      language: "en",
    },
  ],
  [
    "magnolia",
    "Magnolia",
    "1999",
    {
      genres: ["18"],
      directors: ["pta"],
      cast: [],
      runtime: 188,
      language: "en",
    },
  ],
  [
    "casino",
    "Casino",
    "1995",
    {
      genres: ["80"],
      directors: ["scorsese"],
      cast: ["deniro"],
      runtime: 179,
      language: "en",
    },
  ],
  [
    "jackie-brown",
    "Jackie Brown",
    "1997",
    {
      genres: ["80", "53"],
      directors: ["tarantino"],
      cast: [],
      runtime: 154,
      language: "en",
    },
  ],
];

/**
 * A Seen list with its films' details, so the stats show under it: the
 * headline figures and records, and the rest behind "Show more stats". One
 * film is unmatched and has no details, which the stats say.
 */
export const SignedInWithStats: Story = {
  args: {
    user: {
      ...SignedInWithLists.args.user,
      lists: {
        [UserListId.Watchlist]:
          SignedInWithLists.args.user.lists![UserListId.Watchlist],
        [UserListId.Seen]: Object.fromEntries(
          STATS_FILMS.map(([id, title, year], index) => [
            id,
            { title, year, addedAt: 1_757_000_000_000 + index },
          ]),
        ),
      },
      readFilmDetails: async () => ({
        films: Object.fromEntries(
          STATS_FILMS.flatMap(([id, , , details]) =>
            details ? [[id, details]] : [],
          ),
        ),
        people: STATS_PEOPLE,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Your Film Stats" });
    await userEvent.click(
      await canvas.findByRole("button", { name: /More Stats/ }),
    );
    await expect(
      await canvas.findByRole("link", { name: "Akira Kurosawa" }),
    ).toBeInTheDocument();
    await expect(await canvas.findByText("Cantonese")).toBeInTheDocument();
  },
};

/** A short Seen list: under five films, the stats are a nudge instead. */
export const SignedInFewSeen: Story = {
  args: {
    user: {
      ...SignedInWithStats.args.user,
      lists: {
        ...SignedInWithStats.args.user.lists!,
        [UserListId.Seen]: Object.fromEntries(
          Object.entries(
            SignedInWithStats.args.user.lists![UserListId.Seen],
          ).slice(0, 3),
        ),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/2 to go/)).toBeInTheDocument();
  },
};

/**
 * Just past the threshold, with nothing repeated: five films, each by a
 * different director with a different cast, all from one decade and in one
 * language. The headline figures and records show; behind "Show more stats"
 * only the genres do, as rankings of one film each say nothing.
 */
export const SignedInSparseStats: Story = {
  args: {
    user: {
      ...SignedInWithLists.args.user,
      lists: {
        [UserListId.Watchlist]:
          SignedInWithLists.args.user.lists![UserListId.Watchlist],
        [UserListId.Seen]: Object.fromEntries(
          SPARSE_FILMS.map(([id, title, year], index) => [
            id,
            { title, year, addedAt: 1_757_000_000_000 + index },
          ]),
        ),
      },
      readFilmDetails: async () => ({
        films: Object.fromEntries(
          SPARSE_FILMS.map(([id, , , details]) => [id, details]),
        ),
        people: STATS_PEOPLE,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole("heading", { name: "Your Film Stats" });
    await expect(canvas.queryByText("Directors you watch most")).toBeNull();
  },
};

/**
 * The toolbar's "Manage lists" toggle. An empty watchlist draws a second
 * "Manage lists" button inline, once the data has loaded — so a plain name
 * query passes or fails depending on whether the data beat it. The toggle is
 * the one carrying `aria-expanded`.
 */
function findManageListsToggle(canvas: ReturnType<typeof within>) {
  return canvas.findByRole("button", { name: "Manage lists", expanded: false });
}

const SEEN_TITLES = [
  "Alien",
  "Amélie",
  "Brazil",
  "Casablanca",
  "Chinatown",
  "Days of Heaven",
  "Do the Right Thing",
  "Fargo",
  "Heat",
  "Jaws",
  "La Haine",
  "Le Samouraï",
  "Magnolia",
  "Mulholland Drive",
  "Nashville",
  "Paris, Texas",
  "Persona",
  "Playtime",
  "Rashomon",
  "Ran",
  "Stalker",
  "Taxi Driver",
  "The Conversation",
  "Tokyo Story",
  "Vertigo",
  "Yi Yi",
];

/**
 * A long Seen list, drawn as a stack of posters that opens into the full list,
 * and a watchlist whose films that aren't showing sit beneath the rest.
 */
export const SignedInLongLists: Story = {
  args: {
    user: {
      status: "signed-in",
      email: "reader@example.com",
      lists: {
        [UserListId.Watchlist]: {
          ...SignedInWithLists.args.user.lists![UserListId.Watchlist],
          "not-showing-1": {
            title: "Wanda",
            year: "1970",
            addedAt: 1_758_200_000_000,
          },
          "not-showing-2": {
            title: "Killer of Sheep",
            year: "1978",
            addedAt: 1_758_300_000_000,
          },
        },
        [UserListId.Seen]: {
          ...SignedInWithLists.args.user.lists![UserListId.Seen],
          ...Object.fromEntries(
            SEEN_TITLES.map((title, index) => [
              `seen-${index}`,
              { title, addedAt: 1_757_000_000_000 + index },
            ]),
          ),
        },
      },
      favouriteVenues: SignedInWithLists.args.user.favouriteVenues,
    },
  },
};

/**
 * The list tools opened from the account bar, with editing buttons shown —
 * which opens every stack, since a closed one would hide them.
 */
export const SignedInManagingLists: Story = {
  args: SignedInWithLists.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await findManageListsToggle(canvas));
    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Show editing buttons on your lists",
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

/**
 * Finding a film: what's showing as the reader types, then every film on
 * TheMovieDB once they ask (Enter, or the button under what's showing).
 */
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
      "dune{enter}",
    );
    await canvas.findByRole("alert");
  },
};

/**
 * A Letterboxd watchlist export: one film showing against the current data
 * (We All Loved Each Other So Much), one already on the list (Cinema
 * Paradiso), two that aren't showing and one TheMovieDB doesn't know.
 */
const letterboxdWatchlist = new File(
  [
    [
      "Date,Name,Year,Letterboxd URI",
      "2024-01-01,We All Loved Each Other So Much,1974,https://boxd.it/a",
      "2024-01-02,Cinema Paradiso,1988,https://boxd.it/b",
      "2024-01-03,Punch-Drunk Love,2002,https://boxd.it/c",
      '2024-01-04,"Paris, Texas",1984,https://boxd.it/d',
      "2024-01-05,A Film Nobody Made,1999,https://boxd.it/e",
    ].join("\n"),
  ],
  "watchlist.csv",
  { type: "text/csv" },
);

/** What the Worker's match endpoint finds for the films not showing. */
const tmdbMatches: Record<string, object> = {
  "Punch-Drunk Love": { id: "8051", title: "Punch-Drunk Love", year: "2002" },
  "Paris, Texas": { id: "655", title: "Paris, Texas", year: "1984" },
};

async function importWatchlist(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(await findManageListsToggle(canvas));
  // The data has to load before an import can start.
  const button = await canvas.findByRole("button", {
    name: "Import to Watchlist",
  });
  await waitFor(() => expect(button).toBeEnabled(), { timeout: 10000 });
  const input =
    canvasElement.querySelector<HTMLInputElement>('input[type="file"]')!;
  await userEvent.upload(input, letterboxdWatchlist);
  return canvas;
}

/** A Letterboxd import, with films that aren't showing found on TheMovieDB. */
export const SignedInImportReview: Story = {
  args: SignedInWithLists.args,
  parameters: {
    msw: {
      handlers: [
        http.post("/api/tmdb/match", async ({ request }) => {
          const { films } = (await request.json()) as {
            films: { title: string }[];
          };
          return HttpResponse.json({
            results: films.map(({ title }) => tmdbMatches[title] ?? null),
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await importWatchlist(canvasElement);
    await canvas.findByText(/lists 5 films/);
  },
};

/** Looking films up on TheMovieDB, which is paced and can take minutes. */
export const SignedInImportLookingUp: Story = {
  args: SignedInWithLists.args,
  parameters: {
    msw: {
      handlers: [
        http.post("/api/tmdb/match", async () => {
          await delay("infinite");
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = await importWatchlist(canvasElement);
    await canvas.findByRole("progressbar");
  },
};

export const Unavailable: Story = {
  args: { user: { status: "unavailable" } },
};

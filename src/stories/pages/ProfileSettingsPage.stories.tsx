import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import ProfileSettingsPageContent from "@/app/personalise/profile/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import { UserListId } from "@/lib/user-lists";
import {
  ALL_PROFILE_SECTIONS,
  ProfileSectionId,
  type UserProfile,
} from "@/lib/user-profile";

function ProfileSettingsPageWrapper({
  user,
}: {
  user: Partial<UserContextType>;
}) {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <MockUserProvider value={user}>
            <ProfileSettingsPageContent
              venueImagePaths={{
                "riocinema.org.uk": "/images/venues/riocinema.org.uk.png",
              }}
              movieLists={[]}
            />
          </MockUserProvider>
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

/**
 * `/personalise/profile/`: a reader's handle, what their profile shows, and
 * whether it's public, in that order, over a preview of the page. Going
 * public waits until what's shown has been saved once.
 */
const meta = {
  title: "Pages/Profile Settings Page",
  component: ProfileSettingsPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof ProfileSettingsPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const GRANTED = async () => ({
  [CapabilityId.PublicProfile]: { grantedAt: 0 },
});

const READER = {
  status: "signed-in",
  email: "reader@example.com",
  readCapabilities: GRANTED,
  lists: {
    [UserListId.Watchlist]: {
      "496243": { title: "Parasite", year: "2019", addedAt: 1_758_000_000_000 },
    },
    [UserListId.Seen]: {
      "843": {
        title: "In the Mood for Love",
        year: "2000",
        addedAt: 1_757_000_000_000,
      },
    },
  },
  favouriteVenues: {
    "riocinema.org.uk": { name: "Rio Cinema", addedAt: 1_758_000_000_000 },
  },
} satisfies Partial<UserContextType>;

/** Nothing saved yet: a handle first, and the rest waits for it. */
export const NoHandle: Story = {
  args: { user: READER },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("textbox", { name: "Handle" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Save what's shown" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("checkbox", { name: "Public" }),
    ).toBeDisabled();
    await expect(
      canvas.getAllByText("Save a handle first.").length,
    ).toBeGreaterThan(0);
  },
};

/**
 * A handle, but nothing chosen: every section starts on, and the public
 * switch waits for the choice to be saved. Turning one off takes it out of
 * the preview at once.
 */
export const ChoosingSections: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({ handle: "film-fan", public: false }),
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const publicSwitch = await canvas.findByRole("checkbox", {
      name: "Public",
    });
    await expect(publicSwitch).toBeDisabled();
    await expect(
      canvas.getByText("Choose what your profile shows and save it first."),
    ).toBeInTheDocument();
    for (const label of [
      "Seen stats",
      "Watchlist",
      "Favourite venues",
      "Seen list",
    ]) {
      await expect(canvas.getByRole("checkbox", { name: label })).toBeChecked();
    }

    await expect(
      await canvas.findByRole("heading", { name: /Favourite Venues/ }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Favourite venues" }),
    );
    await expect(
      canvas.queryByRole("heading", { name: /Favourite Venues/ }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: "Save what's shown" }),
    );
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        handle: "film-fan",
        public: false,
        sections: {
          ...ALL_PROFILE_SECTIONS,
          [ProfileSectionId.FavouriteVenues]: false,
        },
      } satisfies UserProfile),
    );
    await waitFor(() => expect(publicSwitch).toBeEnabled());
  },
};

/**
 * The stats shown without the Seen list: saying the list is still sent,
 * since the stats are worked out from it in the visitor's browser.
 */
export const StatsWithoutSeenList: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({
        handle: "film-fan",
        public: false,
        sections: ALL_PROFILE_SECTIONS,
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: "Seen list" }),
    );
    await expect(
      canvas.getByText(/your Seen list is still sent with the page/),
    ).toBeInTheDocument();
    // Changed and not saved: going public waits for the save.
    await expect(
      canvas.getByRole("checkbox", { name: "Public" }),
    ).toBeDisabled();
    await expect(
      canvas.getByText("Save your changes to what it shows first."),
    ).toBeInTheDocument();
  },
};

/** Public, with a choice saved: it can be switched off at any time. */
export const Public: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({
        handle: "film-fan",
        public: true,
        sections: {
          ...ALL_PROFILE_SECTIONS,
          [ProfileSectionId.Watchlist]: false,
        },
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const publicSwitch = await canvas.findByRole("checkbox", {
      name: "Public",
    });
    await expect(publicSwitch).toBeChecked();
    await expect(publicSwitch).toBeEnabled();
    await expect(
      canvas.getByRole("link", { name: "View your profile" }),
    ).toHaveAttribute("href", "/u/film-fan/");
    await expect(
      canvas.getByRole("checkbox", { name: "Watchlist" }),
    ).not.toBeChecked();
  },
};

/**
 * Public from before sections existed: it shows everything, says so, and
 * can't be renamed until a choice is saved, which the rules would refuse.
 */
export const PublicBeforeSections: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({ handle: "film-fan", public: true }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/went public before you could choose/),
    ).toBeInTheDocument();
    const input = canvas.getByRole("textbox", { name: "Handle" });
    await userEvent.clear(input);
    await userEvent.type(input, "film-buff");
    await expect(
      canvas.getByRole("button", { name: "Change handle" }),
    ).toBeDisabled();
    // Under the handle, the name and links, and the favourites, which wait
    // too.
    await expect(
      canvas.getAllByText("Choose what your profile shows first, below."),
    ).toHaveLength(3);
  },
};

/**
 * A name and links: what a name can't hold drops out as it's typed, a pasted
 * profile address is read for its username, and a link that can't be read
 * says why and holds the save. The preview shows them as they're typed.
 */
export const NameAndLinks: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({
        handle: "film-fan",
        public: false,
        sections: ALL_PROFILE_SECTIONS,
      }),
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const name = await canvas.findByRole("textbox", { name: "Name" });
    await userEvent.type(name, 'Siobhán "Shiv" O\'Brien');
    await expect(name).toHaveValue("Siobhán Shiv O'Brien");
    await expect(
      canvas.getByRole("heading", { name: "Siobhán Shiv O'Brien" }),
    ).toBeInTheDocument();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Letterboxd" }),
      "https://letterboxd.com/film_fan/",
    );
    const imdb = canvas.getByRole("textbox", { name: "IMDb" });
    await userEvent.type(imdb, "nm0000123");
    await expect(
      canvas.getByText(/The address of your IMDb profile/),
    ).toBeInTheDocument();
    const save = canvas.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();

    await userEvent.clear(imdb);
    await userEvent.type(imdb, "imdb.com/user/ur1234567/");
    await expect(
      canvas.getByRole("link", { name: "Letterboxd" }),
    ).toHaveAttribute("href", "https://letterboxd.com/film_fan/");
    await userEvent.click(save);
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        handle: "film-fan",
        public: false,
        sections: ALL_PROFILE_SECTIONS,
        displayName: "Siobhán Shiv O'Brien",
        links: { letterboxd: "film_fan", imdb: "ur1234567" },
      } satisfies UserProfile),
    );
  },
};

/**
 * Favourites: the Seen list is searched as it's typed, TheMovieDB only when
 * asked, and picks fill the four places in order, saved together.
 */
export const PickingFavourites: Story = {
  args: {
    user: {
      ...READER,
      getIdToken: async () => "token",
      readProfile: async () => ({
        handle: "film-fan",
        public: false,
        sections: ALL_PROFILE_SECTIONS,
      }),
      saveProfile: fn(async () => {}),
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/tmdb/search", () =>
          HttpResponse.json({
            page: 1,
            totalPages: 1,
            totalResults: 1,
            results: [{ id: "949", title: "Heat", year: "1995" }],
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const search = await canvas.findByRole("textbox", {
      name: "Search for a favourite film",
    });
    await userEvent.type(search, "mood");
    await expect(
      await canvas.findByRole("heading", { name: "From your Seen list" }),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(
      canvas.getByRole("button", { name: "Remove In the Mood for Love" }),
    ).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "heat");
    await expect(
      await canvas.findByText(/Nothing on your Seen list matches/),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Search all films" }),
    );
    await userEvent.click(await canvas.findByRole("button", { name: "Add" }));
    // Heat goes second; moved first, it leads.
    await userEvent.click(
      canvas.getByRole("button", { name: "Move Heat earlier" }),
    );

    await userEvent.click(
      canvas.getByRole("button", { name: "Save favourites" }),
    );
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        handle: "film-fan",
        public: false,
        sections: ALL_PROFILE_SECTIONS,
        favourites: [
          { id: "949", title: "Heat", year: "1995" },
          { id: "843", title: "In the Mood for Love", year: "2000" },
        ],
      } satisfies UserProfile),
    );
  },
};

/** Signed in without the capability: nothing to set up. */
export const NotGranted: Story = {
  args: {
    user: { ...READER, readCapabilities: async () => ({}) },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/aren't switched on for your account yet/),
    ).toBeInTheDocument();
  },
};

/** Signed out: the profile starts with an account. */
export const SignedOut: Story = {
  args: { user: { status: "signed-out" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/personalise/");
  },
};

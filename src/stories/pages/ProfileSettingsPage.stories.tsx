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
 * `/personalise/profile/`: where the profile stands and the way to publish
 * it, then the address, name and links, favourite films and what it shows,
 * as one draft with one Save, beside a preview of the page (a dialog from
 * the save bar on a narrow screen). Publishing first says what goes public.
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
  isHandleTaken: async () => false,
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

const SAVED: UserProfile = {
  handle: "film-fan",
  public: false,
  sections: { ...ALL_PROFILE_SECTIONS, [ProfileSectionId.Watchlist]: false },
};

/**
 * Nothing saved yet: everything is one draft, the address checked as it's
 * typed, and one Save claims it with the rest.
 */
export const NewProfile: Story = {
  args: { user: { ...READER, saveProfile: fn(async () => {}) } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const save = await canvas.findByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();
    // What stops publishing stands in place of the button.
    await expect(
      canvas.queryByRole("button", { name: /publish/i }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByText("Choose your handle to publish"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("Choose your handle to save"),
    ).toBeInTheDocument();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Handle" }),
      "Film-Fan",
    );
    await expect(await canvas.findByText("It's free.")).toBeInTheDocument();
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Name" }),
      'Siobhán "Shiv"',
    );
    await expect(canvas.getByText("Unsaved changes")).toBeInTheDocument();
    await userEvent.click(save);
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        handle: "film-fan",
        displayName: "Siobhán Shiv",
        sections: ALL_PROFILE_SECTIONS,
        public: false,
      } satisfies UserProfile),
    );
    await expect(
      await canvas.findByText("All changes saved"),
    ).toBeInTheDocument();
  },
};

/** An address someone else has: said as it's typed, and Save waits. */
export const HandleTaken: Story = {
  args: { user: { ...READER, isHandleTaken: async () => true } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      await canvas.findByRole("textbox", { name: "Handle" }),
      "admin-ish",
    );
    await expect(
      await canvas.findByText("That's taken. Try another."),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
};

/**
 * Publishing: one press saves the draft and makes it public, and the card
 * lights up with the address to copy or share.
 */
export const Publishing: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => SAVED,
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Your profile is private" }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Publish profile" }),
    );
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        ...SAVED,
        public: true,
      }),
    );
    await expect(
      await canvas.findByRole("heading", { name: "You're live" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText("clusterflick.com/u/film-fan"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: "Copy link" }),
    ).toBeInTheDocument();
  },
};

/** Public: taking it down never waits for anything. */
export const Public: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({ ...SAVED, public: true }),
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { name: "Your profile is public" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "View your profile" }),
    ).toHaveAttribute("href", "/u/film-fan/");
    await userEvent.click(
      canvas.getByRole("button", { name: "Make it private" }),
    );
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        ...SAVED,
        public: false,
      }),
    );
  },
};

/** A rename frees the old address at once, so saving one asks first. */
export const Renaming: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({ ...SAVED, public: true }),
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = await canvas.findByRole("textbox", { name: "Handle" });
    await userEvent.clear(handle);
    await userEvent.type(handle, "film-buff");
    await expect(await canvas.findByText("It's free.")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(
      canvas.getByText(
        /clusterflick\.com\/u\/film-fan will stop working straight away/,
      ),
    ).toBeInTheDocument();
    await expect(args.user.saveProfile).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole("button", { name: "Change it" }));
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        ...SAVED,
        handle: "film-buff",
        public: true,
      }),
    );
  },
};

/**
 * Publishing with a new address saves it too, so it asks first: the old
 * address is freed, which can't be undone.
 */
export const PublishingWithRename: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => SAVED,
      saveProfile: fn(async () => {}),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const handle = await canvas.findByRole("textbox", { name: "Handle" });
    await userEvent.clear(handle);
    await userEvent.type(handle, "film-buff");
    await expect(await canvas.findByText("It's free.")).toBeInTheDocument();
    // Publishing saves the changes too, and says so.
    await userEvent.click(
      canvas.getByRole("button", { name: "Save and publish" }),
    );
    await expect(
      canvas.getByText(/clusterflick\.com\/u\/film-fan will stop working/),
    ).toBeInTheDocument();
    await expect(args.user.saveProfile).not.toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Change it and publish" }),
    );
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        ...SAVED,
        handle: "film-buff",
        public: true,
      }),
    );
  },
};

/** Discard puts the draft back as it was saved. */
export const Discarding: Story = {
  args: { user: { ...READER, readProfile: async () => SAVED } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = await canvas.findByRole("textbox", { name: "Name" });
    await userEvent.type(name, "Someone");
    await userEvent.click(canvas.getByRole("button", { name: "Discard" }));
    await expect(name).toHaveValue("");
    await expect(canvas.getByText("All changes saved")).toBeInTheDocument();
  },
};

/**
 * The stats shown without the Seen list: saying the list is still sent,
 * since the stats are worked out from it in the visitor's browser.
 */
export const StatsWithoutSeenList: Story = {
  args: { user: { ...READER, readProfile: async () => SAVED } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: "Seen list" }),
    );
    await expect(
      canvas.getByText(/your Seen list is\s+still sent with it/),
    ).toBeInTheDocument();
  },
};

/** Every section switched off: the popcorn, knocked over. */
export const EverythingSwitchedOff: Story = {
  args: { user: { ...READER, readProfile: async () => SAVED } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Seen stats", "Favourite venues", "Seen list"]) {
      await userEvent.click(await canvas.findByRole("checkbox", { name }));
    }
    await expect(
      canvas.getByRole("img", { name: "The Clusterflick popcorn, spilled" }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByText(/everything switched off/),
    ).toBeInTheDocument();
  },
};

/**
 * Favourites: an empty place opens the search, the Seen list is searched as
 * it's typed, TheMovieDB only when asked, and picks are put in order.
 */
export const PickingFavourites: Story = {
  args: {
    user: {
      ...READER,
      getIdToken: async () => "token",
      readProfile: async () => SAVED,
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
    // Every empty place opens the search.
    const [firstPlace] = await canvas.findAllByRole("button", {
      name: /Add a film/,
    });
    await userEvent.click(firstPlace);
    const search = canvas.getByRole("textbox", {
      name: "Search for a favourite film",
    });
    await expect(search).toHaveFocus();
    await userEvent.type(search, "mood");
    // The whole tile is the button.
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Add: In the Mood for Love/ }),
    );
    await expect(
      canvas.getByRole("button", { name: "Remove In the Mood for Love" }),
    ).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "heat");
    await userEvent.click(
      await canvas.findByRole("button", { name: "Search all films" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: /^Add: Heat/ }),
    );
    await expect(
      canvas.getByRole("button", { name: /^Added: Heat/ }),
    ).toBeDisabled();
    await userEvent.click(
      canvas.getByRole("button", { name: "Move Heat earlier" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.user.saveProfile).toHaveBeenCalledWith({
        ...SAVED,
        favourites: [
          { id: "949", title: "Heat", year: "1995" },
          { id: "843", title: "In the Mood for Love", year: "2000" },
        ],
      }),
    );
  },
};

/** Four favourites: the search gives way to saying they're full. */
export const FavouritesFull: Story = {
  args: {
    user: {
      ...READER,
      readProfile: async () => ({
        ...SAVED,
        favourites: [
          { id: "949", title: "Heat", year: "1995" },
          { id: "843", title: "In the Mood for Love", year: "2000" },
          { id: "11216", title: "Cinema Paradiso", year: "1988" },
          { id: "1018", title: "Mulholland Drive", year: "2001" },
        ],
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/You've filled your favourites!/),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("textbox", { name: "Search for a favourite film" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Remove Heat" }));
    await expect(
      canvas.getByRole("textbox", { name: "Search for a favourite film" }),
    ).toBeInTheDocument();
  },
};

/**
 * Public from before sections existed: it shows everything, says so, and
 * saving is what records the choice.
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
    await expect(canvas.getByText("Unsaved changes")).toBeInTheDocument();
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

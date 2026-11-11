import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { ProfilePage } from "@/app/profile-shell/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
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
            <ProfilePage data={data} />
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

const FOUND: ProfilePageData = {
  found: true,
  handle: "film-fan",
  seen: {
    count: 412,
    films: [
      {
        id: "samurai",
        title: "Le Samouraï",
        year: "1967",
        posterPath: "/2Ys8ScbQdkXGnZOFQmmzvT6vKLq.jpg",
      },
      { id: "heat", title: "Heat", year: "1995" },
      { id: "long-gone", title: "A Film Long Gone", year: "1950" },
    ],
  },
  watchlist: {
    count: 2,
    films: [
      { id: "mood", title: "In the Mood for Love", year: "2000" },
      { id: "chungking", title: "Chungking Express", year: "1994" },
    ],
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
      canvas.getByText("412 films seen, 2 films on the watchlist"),
    ).toBeInTheDocument();
    await expect(canvas.getByText("and 409 more films")).toBeInTheDocument();
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
      seen: { count: 0, films: [] },
      watchlist: { count: 0, films: [] },
    },
    user: { status: "signed-out" },
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

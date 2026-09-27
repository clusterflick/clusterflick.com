import type { Meta, StoryObj } from "@storybook/react";
import VenueHeroDetails from "@/components/venue-hero-details";
import { expect, userEvent, within } from "storybook/test";
import FavouriteVenueButton from "@/components/favourite-venue-button";
import { MockUserProvider } from "@/state/user-context";

/**
 * `VenueHeroDetails` is the metadata that sits beneath the title inside a
 * venue's `DetailPageHero`: social links on the left, the status card in the
 * centre, and the calendar subscription targets (Google, Outlook, webcal) on
 * the right, with the venue type as a `Tag` beneath — and any `children`
 * beside it, which on the venue page is `FavouriteVenueButton`. The hero is
 * given `showStatusCard={false}`, since this places the card.
 *
 * **When to use:**
 * - Inside a `DetailPageHero` on a venue page or one of its sub-pages, so every
 *   page for a venue carries an identical header.
 *
 * **When NOT to use:**
 * - For non-venue entities (festivals, film clubs, cinema groups) — they have
 *   no calendar feed, and the subscription icons would be dead weight.
 * - As a standalone metadata block outside a hero; the three-column grid
 *   assumes the centred hero layout.
 *
 * The subscription URLs are derived from `venueId`, which is the filename each
 * venue's ICS feed is published under in the `data-calendar` release.
 */
const meta = {
  title: "Components/VenueHeroDetails",
  component: VenueHeroDetails,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  // The width of the hero's content, which the side columns share out.
  decorators: [
    (Story) => (
      <div style={{ width: "min(900px, calc(100vw - 32px))" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    venueId: "actonecinema.co.uk",
    venueName: "ActOne Cinema",
    venueType: "Cinema",
    movieCount: 192,
    performanceCount: 536,
  },
} satisfies Meta<typeof VenueHeroDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A venue with a full set of social accounts. */
export const Default: Story = {
  args: {
    socials: {
      letterboxd: "actonecinema",
      twitter: "actonecinema",
      instagram: "actonecinema",
    },
  },
};

/** Most venues have no social accounts recorded; the row stays balanced. */
export const WithoutSocials: Story = {
  args: {
    socials: null,
  },
};

/**
 * Venues that fit none of the vocabulary's categories carry the type "Other",
 * which is rendered like any other type.
 */
export const OtherType: Story = {
  args: {
    venueType: "Other",
    socials: null,
  },
};

/** On the venue page, with the My venue button beside the type. */
export const WithMyVenueButton: Story = {
  args: {
    socials: { letterboxd: "actonecinema", twitter: null, instagram: null },
    children: (
      <FavouriteVenueButton
        venue={{ id: "actonecinema.co.uk", name: "ActOne Cinema" }}
      />
    ),
  },
};

/** Nothing on: the card says when the last screening was. */
export const NothingShowing: Story = {
  args: {
    socials: null,
    movieCount: 0,
    performanceCount: 0,
    lastPerformance: Date.UTC(2026, 7, 14),
  },
};

/** A failed save: the error goes on a line of its own beneath the row. */
export const MyVenueSaveFailed: Story = {
  args: {
    socials: null,
    children: (
      <MockUserProvider
        value={{
          status: "signed-in",
          favouriteVenues: {},
          addFavouriteVenue: () => Promise.reject(new Error("Denied")),
        }}
      >
        <FavouriteVenueButton
          venue={{ id: "actonecinema.co.uk", name: "ActOne Cinema" }}
        />
      </MockUserProvider>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /my venue/i }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "That didn't save",
    );
  },
};

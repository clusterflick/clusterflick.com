import type { Meta, StoryObj } from "@storybook/react";
import VenueHeroDetails from "@/components/venue-hero-details";

/**
 * `VenueHeroDetails` is the metadata row that sits beneath the title inside a
 * venue's `DetailPageHero`: social links on the left, the venue type as a
 * centred `Tag`, and the calendar subscription targets (Google, Outlook,
 * webcal) on the right.
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
  args: {
    venueId: "actonecinema.co.uk",
    venueName: "ActOne Cinema",
    venueType: "Cinema",
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
 * Venues whose type is unrecorded come through the dataset as "unknown" and are
 * presented as "Other" rather than exposing the raw value.
 */
export const UnknownType: Story = {
  args: {
    venueType: "unknown",
    socials: null,
  },
};

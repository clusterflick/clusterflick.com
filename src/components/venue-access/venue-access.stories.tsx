import type { Meta, StoryObj } from "@storybook/react";
import VenueAccess from "@/components/venue-access";
import type {
  AccessFact,
  VenueAccess as VenueAccessRecord,
  VenueAccessField,
} from "@/utils/venue-access-types";
import { VENUE_ACCESS_FIELDS } from "@/utils/venue-access-types";
import greenwich from "./fixtures/greenwich.json";
import ritzy from "./fixtures/the-ritzy.json";

/**
 * `VenueAccess` shows what a venue's building and screens offer: getting in,
 * a table of its screens, and its facilities, each fact footnoted to the page
 * it was quoted from and the day it was checked. It renders a record from
 * clusterflick/venue-accessibility as it is, so the wording a venue page uses
 * for "not published", a conflict or the last report found lives here.
 *
 * **When to use:**
 * - The venue page's access section, for a venue the release carries.
 *
 * **When NOT to use:**
 * - What a screening offers (subtitles, audio description, relaxed). That is
 *   `performance.accessibility`, shown with `LinkedList` on the venue page and
 *   on `/accessibility`.
 *
 * The first two stories are real records, as published: Greenwich Picturehouse
 * (a screen with no step-free access, and its page contradicting itself on
 * wheelchair spaces) and the Ritzy (spaces on the front row, headphones in
 * every screen).
 */
const meta = {
  title: "Components/VenueAccess",
  component: VenueAccess,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof VenueAccess>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Conflicts on wheelchair spaces, and a screen down 21 steps. */
export const WithConflicts: Story = {
  args: {
    access: greenwich as unknown as VenueAccessRecord,
    venueName: "Greenwich Picturehouse",
  },
};

/** Wheelchair spaces with a position, and hearing help in every screen. */
export const WithPositions: Story = {
  args: {
    access: ritzy as unknown as VenueAccessRecord,
    venueName: "The Ritzy",
  },
};

const unknown = (): AccessFact => ({
  status: "unknown",
  note: null,
  sources: [],
  conflict: null,
  last_found: null,
});

const allUnknown = (): VenueAccessRecord => ({
  id: "example-cinema",
  access_page_url: null,
  access_contact: null,
  notes: null,
  screens: [],
  ...(Object.fromEntries(
    VENUE_ACCESS_FIELDS.map((field) => [field, unknown()]),
  ) as Record<VenueAccessField, AccessFact>),
});

/**
 * A venue that publishes nothing about access, with only a contact to ask.
 * An invented venue: no real record looks like this yet.
 */
export const ContactOnly: Story = {
  args: {
    access: {
      ...allUnknown(),
      access_contact: "Phone the box office before your visit",
    },
    venueName: "Example Cinema",
  },
};

/**
 * A chain-wide policy, and a field we don't know with the last report found
 * in a source we don't trust for a status. An invented venue: no real record
 * has either yet.
 */
export const LastReportAndChainPolicy: Story = {
  args: {
    access: {
      ...allUnknown(),
      assistance_dogs: {
        ...unknown(),
        status: "yes",
        note: "Tell them when booking",
        sources: [
          {
            url: "https://example.com/accessibility",
            tier: 1,
            source_last_updated: null,
            checked_on: "2026-11-21",
            quote: "Assistance dogs are welcome at all our cinemas.",
            chain_wide: true,
          },
        ],
      },
      lift: {
        ...unknown(),
        last_found: {
          claim: "There's a lift to the upstairs screens",
          url: "https://example.org/reviews/example-cinema",
          tier: 3,
          found_on: "2026-11-20",
        },
      },
    },
    venueName: "Example Cinema",
  },
};

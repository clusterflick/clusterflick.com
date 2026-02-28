import type { Meta, StoryObj } from "@storybook/react";
import EventDetailPageContent from "@/components/event-detail-page-content";

/**
 * `EventDetailPageContent` is the shared detail page layout for curated film
 * programmes — festivals, film clubs, and similar named entities. It composes
 * `DetailPageHero`, an optional About + Cinemas section, and the film poster
 * grid. The `Blurb` component and `venues` array are optional; the layout
 * adapts when either is absent.
 *
 * **When to use:**
 * - Detail pages for festivals, film clubs, or any curated film programme.
 *
 * **When NOT to use:**
 * - Venue detail pages.
 * - Movie detail pages.
 */
const meta = {
  title: "Components/EventDetailPageContent",
  component: EventDetailPageContent,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EventDetailPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseArgs = {
  name: "Ghibliotheque",
  url: "https://www.ghibliotheque.com",
  imagePath: null,
  movieCount: 5,
  performanceCount: 8,
  backUrl: "/film-clubs",
  backText: "All film clubs",
  gridMovies: [],
  Blurb: null,
  isAlias: false,
  canonicalUrl: "/film-clubs/ghibliotheque",
  venues: [],
};

/** Detail page with no blurb and no venues — minimal state. */
export const Minimal: Story = {
  args: baseArgs,
};

/** Detail page with a blurb component. */
export const WithBlurb: Story = {
  args: {
    ...baseArgs,
    Blurb: () => (
      <section>
        <p>
          Ghibliotheque is a celebration of Studio Ghibli and the films of
          Hayao Miyazaki.
        </p>
      </section>
    ),
  },
};

/** Detail page rendered as an alias — triggers the canonical redirect. */
export const AliasRedirect: Story = {
  args: {
    ...baseArgs,
    isAlias: true,
    canonicalUrl: "/film-clubs/ghibliotheque",
  },
};

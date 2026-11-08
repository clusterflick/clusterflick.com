import type { Meta, StoryObj } from "@storybook/react";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import StandardPageLayout from "@/components/standard-page-layout";
import DetailPageHero from "@/components/detail-page-hero";
import ContentSection from "@/components/content-section";
import { handlers } from "../../../.storybook/msw/handlers";

/**
 * `StandardPageLayout` is the shared shell for listing and browse pages
 * (Venues, Festivals, London Cinemas, Borough detail). It composes
 * `PreloadCinemaData`, `PageHeader`, a centred light-circles `HeroSection`,
 * a `Divider`, and a constrained content wrapper — removing that boilerplate
 * from every listing page.
 *
 * **When to use:**
 * - Any page that follows the pattern: back navigation → centred hero with
 *   title/subtitle → horizontal divider → constrained content below.
 * - The four listing pages (Venues, Festivals, London Cinemas, Borough) all
 *   use this component.
 *
 * **Props:**
 * - `title` — plain string passed to `OutlineHeading` (no JSX).
 * - `subtitle` — optional plain string rendered as a `<p>` below the heading.
 * - `heroExtra` — optional `ReactNode` rendered inside the hero after the
 *   subtitle; use for structured elements like status badges that cannot be
 *   expressed as plain text (e.g. the borough status card).
 * - `hero` — optional fully-rendered hero (e.g. `DetailPageHero`) that replaces
 *   the default title-based hero; pass EITHER `title` OR `hero`, not both. Used
 *   by the venue/event detail pages.
 * - `width` — the content column: `prose` for reading pages, `default` (the
 *   default) for cards and lists, `wide` for poster rows. See "Page Widths"
 *   in CLAUDE.md.
 * - `afterContent` — optional full-width content rendered below the constrained
 *   wrapper (e.g. an edge-to-edge poster grid).
 * - `backUrl` / `backText` — forwarded to `PageHeader`.
 * - `children` — page body rendered inside the constrained content wrapper.
 *
 * **When NOT to use:**
 * - Home page (has its own `MainHeader` and no back nav).
 * - Movie detail page (has a different hero layout).
 * - About page (uses an `extended` hero with a logo image).
 */
const meta = {
  title: "Components/StandardPageLayout",
  component: StandardPageLayout,
  decorators: [
    (Story) => (
      <CinemaDataProvider>
        <FilterConfigProvider>
          <Story />
        </FilterConfigProvider>
      </CinemaDataProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
    msw: { handlers },
    nextjs: { appDirectory: true },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StandardPageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard listing page with a plain text subtitle — as used on the Venues
 * and Festivals pages.
 */
export const WithSubtitle: Story = {
  args: {
    title: "Venues",
    subtitle: "300 venues across London",
    backUrl: "/",
    backText: "Back to film list",
    children: (
      <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
        Page content appears here, below the hero and divider, inside a
        constrained wrapper at the default page width.
      </p>
    ),
  },
};

/**
 * Layout with no subtitle — title only. Useful when the count or description
 * is not available at render time.
 */
export const TitleOnly: Story = {
  args: {
    title: "Festivals",
    backUrl: "/",
    backText: "Back to film list",
    children: (
      <p style={{ color: "rgba(255,255,255,0.7)" }}>Festival list goes here.</p>
    ),
  },
};

const PROSE_PARAGRAPH = (
  <p style={{ lineHeight: 1.7, margin: "0 0 20px" }}>
    Clusterflick&apos;s listings are published for reuse under CC BY 4.0. Use
    them for anything, commercial or not, as long as you say where they came
    from and link back, so that whoever reads your work can find the source and
    check it for themselves.
  </p>
);

/**
 * `width="prose"` — a reading page such as the data licence or the bot page,
 * built from `ContentSection`s.
 */
export const Prose: Story = {
  args: {
    title: "Data Licence",
    subtitle: "What you can do with the data, and how to credit it.",
    width: "prose",
    children: (
      <>
        <ContentSection title="What's covered">
          {PROSE_PARAGRAPH}
          {PROSE_PARAGRAPH}
        </ContentSection>
        <ContentSection title="How to credit Clusterflick">
          {PROSE_PARAGRAPH}
        </ContentSection>
        <ContentSection title="What isn't covered">
          {PROSE_PARAGRAPH}
          {PROSE_PARAGRAPH}
          {PROSE_PARAGRAPH}
        </ContentSection>
      </>
    ),
  },
};

/**
 * Layout with `heroExtra` — a structured element rendered inside the hero after
 * the title. Used by the Borough detail page to show a venue/film count badge.
 */
export const WithHeroExtra: Story = {
  args: {
    title: "Cinemas in Hackney, London",
    heroExtra: (
      <div
        style={{
          marginTop: 24,
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          display: "inline-block",
          background: "rgba(46, 196, 134, 0.15)",
          border: "1px solid rgba(46, 196, 134, 0.4)",
          color: "#5ee6a0",
        }}
      >
        <p>
          <strong>8</strong> venues · <strong>42</strong> films
        </p>
      </div>
    ),
    backUrl: "/london-cinemas",
    backText: "All boroughs",
    children: (
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        Borough content goes here.
      </p>
    ),
  },
};

/**
 * Entity page with a custom `hero` — here a `DetailPageHero` — instead of the
 * default title-based hero. Used by the venue and event detail pages, which
 * need a logo, an external link and a film/showing status card in the hero.
 */
export const WithCustomHero: Story = {
  args: {
    hero: (
      <DetailPageHero
        name="Prince Charles Cinema"
        url="https://princecharlescinema.com"
        movieCount={42}
        performanceCount={128}
      />
    ),
    backUrl: "/catalogue",
    backText: "Back to film list",
    children: (
      <p style={{ color: "rgba(255,255,255,0.7)" }}>
        Venue detail content goes here, below the custom hero.
      </p>
    ),
  },
};

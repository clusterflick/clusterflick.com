import type { Meta, StoryObj } from "@storybook/react";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";

/**
 * `HeroSection` renders a full-width hero with a blurred, overlaid background
 * image and a content slot for headings, subtitles, or other elements.
 *
 * **When to use:**
 * - At the top of every page that needs a visual hero banner (listing pages,
 *   detail pages, static content pages).
 * - Pass `backdropHeight="extended"` on pages that want a taller, more immersive
 *   hero (e.g. the About page).
 * - Pass `align="center"` for centred listing pages; use the default `"left"`
 *   alignment for detail pages where content flows left-to-right.
 *
 * **When NOT to use:**
 * - Do not nest another `HeroSection` inside a page — only one per page.
 * - For section-level introductions (not full-page heroes), use `ContentSection`
 *   instead.
 */
const meta = {
  title: "Components/HeroSection",
  component: HeroSection,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    backdropHeight: {
      control: "select",
      options: ["standard", "extended"],
      description:
        '"standard" is the default height used on listing pages. "extended" is taller and used on brand/content-heavy pages.',
    },
    align: {
      control: "select",
      options: ["left", "center"],
      description:
        '"center" for listing/browse pages; "left" for detail pages.',
    },
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Standard centred hero used on listing pages (Venues, Festivals, London
 * Cinemas). The `backdropHeight="standard"` keeps the hero compact so content
 * below the fold is quickly visible.
 */
export const Standard: Story = {
  args: {
    backgroundImage: "/images/light-circles.jpg",
    backgroundImageAlt: "Decorative light circles",
    backdropHeight: "standard",
    align: "center",
    children: (
      <>
        <OutlineHeading>Venues</OutlineHeading>
        <p style={{ fontSize: 18, opacity: 0.8 }}>240 venues across London</p>
      </>
    ),
  },
};

/**
 * Extended hero used on brand/about pages where a taller, more atmospheric
 * backdrop creates more visual impact.
 */
export const Extended: Story = {
  args: {
    backgroundImage: "/images/various-movie-seats.jpg",
    backgroundImageAlt: "Rows of cinema seats",
    backdropHeight: "extended",
    align: "center",
    children: (
      <>
        <OutlineHeading>Clusterflick</OutlineHeading>
        <p style={{ fontSize: 18, opacity: 0.8 }}>
          Every film, every cinema, one place.
        </p>
      </>
    ),
  },
};

/**
 * Left-aligned hero as used on detail pages (Venue Detail, Festival Detail).
 * Content aligns to the left rather than being centred.
 */
export const LeftAligned: Story = {
  args: {
    backgroundImage: "/images/light-circles.jpg",
    backgroundImageAlt: "Decorative light circles",
    backdropHeight: "standard",
    align: "left",
    children: (
      <>
        <OutlineHeading as="h1">Prince Charles Cinema</OutlineHeading>
        <p style={{ fontSize: 18, opacity: 0.8 }}>
          Leicester Square · Independent
        </p>
      </>
    ),
  },
};

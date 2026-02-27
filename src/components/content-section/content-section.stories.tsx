import type { Meta, StoryObj } from "@storybook/react";
import ContentSection from "@/components/content-section";

/**
 * `ContentSection` wraps a titled `<section>` with an optional icon, intro
 * paragraph, and slot for child content. It provides consistent spacing and
 * typography for discrete sections of a page.
 *
 * **When to use:**
 * - Any distinct block of page content that needs a heading — film credits,
 *   nearby venues, borough browsing, data format listings, etc.
 * - Use the `icon` prop when the section should be visually anchored by a
 *   small decorative image (e.g. a neon icon).
 * - Use the `intro` prop for a brief explanatory sentence that appears below
 *   the heading.
 * - Pass `align="center"` inside grouped content areas (e.g. the About page's
 *   Connect and Behind-the-Scenes sections).
 *
 * **When NOT to use:**
 * - For the full-page hero, use `HeroSection` instead.
 * - For group-level headings that introduce several `ContentSection`s, use
 *   `GroupHeader` instead.
 */
const meta = {
  title: "Components/ContentSection",
  component: ContentSection,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    as: {
      control: "select",
      options: ["h2", "h3", "h4"],
      description:
        "Heading level. Use h2 for top-level sections, h3/h4 inside nested groups.",
    },
    align: {
      control: "select",
      options: ["left", "center"],
    },
  },
} satisfies Meta<typeof ContentSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default left-aligned section without icon or intro. The most common usage
 * — simply a titled section wrapping child content.
 */
export const Default: Story = {
  args: {
    title: "Nearby Venues",
    children: <p>A list of nearby venues would appear here.</p>,
  },
};

/**
 * Section with an intro sentence below the heading, used when the content
 * needs a brief explanation before diving in.
 */
export const WithIntro: Story = {
  args: {
    title: "Browse Cinemas by London Borough",
    intro: "London is home to one of the richest cinema scenes in the world.",
    children: <p>Borough list content here.</p>,
  },
};

/**
 * Centred alignment used inside grouped content areas on the About page
 * and similar content-led pages.
 */
export const Centred: Story = {
  args: {
    title: "Find Us Around the Internet",
    intro: "Say hi! 👋",
    as: "h3",
    align: "center",
    children: <p>Social links here.</p>,
  },
};

/**
 * Section with a decorative neon icon displayed inline with the heading title.
 */
export const WithIcon: Story = {
  args: {
    title: "Accessibility Features",
    icon: {
      src: "/images/icons/neon-ticket-ripped.svg",
      width: 32,
      height: 32,
    },
    children: <p>Accessibility feature list here.</p>,
  },
};

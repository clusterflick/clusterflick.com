import type { Meta, StoryObj } from "@storybook/react";
import SocialLinks from "./index";

/**
 * `SocialLinks` renders a row of outbound social icon links (Letterboxd,
 * Instagram, X/Twitter) from a set of handles.
 *
 * **When to use:**
 * - Venue detail pages and cinema group pages, to surface a venue's or chain's
 *   social profiles.
 *
 * **When NOT to use:**
 * - For non-profile actions (e.g. calendar subscribe buttons) — those are a
 *   separate concern with their own styling.
 *
 * It renders nothing when no handles are provided, so it is safe to include
 * unconditionally.
 */
const meta = {
  title: "Components/SocialLinks",
  component: SocialLinks,
  parameters: {
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SocialLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

/** All three platforms present. */
export const AllPlatforms: Story = {
  args: {
    socials: {
      letterboxd: "picturehouses",
      instagram: "picturehouses",
      twitter: "picturehouses",
    },
  },
};

/** A single platform. */
export const InstagramOnly: Story = {
  args: {
    socials: {
      letterboxd: null,
      instagram: "everymancinema",
      twitter: null,
    },
  },
};

/** No handles — renders nothing. */
export const Empty: Story = {
  args: {
    socials: null,
  },
};

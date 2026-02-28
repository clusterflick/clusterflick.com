import type { Meta, StoryObj } from "@storybook/react";
import LinkCard, {
  CardArrow,
  CardContent,
  CardDescription,
  CardIcon,
  CardLabel,
  CardSubtext,
  CardTitle,
  CardValue,
} from "@/components/link-card";
import {
  LetterboxdIcon,
  InstagramIcon,
  XIcon,
  BlueskyIcon,
  EmailIcon,
} from "@/components/icons";

/**
 * `LinkCard` is a compound component for clickable external-link cards. It
 * always opens in a new tab.
 *
 * **Variants:**
 * - `"rating"` — External rating source card (Letterboxd, IMDb, RT, etc.).
 *   Use sub-components `CardLabel`, `CardValue`, `CardSubtext`.
 * - `"social"` — Social media profile link. Use `CardIcon` + `CardContent`.
 * - `"contact"` — Email or contact link. Use `CardIcon` + `CardContent`.
 * - `"feature"` — Larger card describing a feature or data format. Use
 *   `CardTitle`, `CardDescription`, `CardArrow`.
 *
 * **Sub-components** (compose inside `LinkCard`):
 * - `CardIcon` — icon container (SVG or Image)
 * - `CardContent` — inline text content (used in social/contact)
 * - `CardLabel` — small label above the value (used in rating)
 * - `CardValue` — prominent value (used in rating)
 * - `CardSubtext` — small secondary text below the value (used in rating)
 * - `CardTitle` — heading inside the card (used in feature)
 * - `CardDescription` — body text (used in feature)
 * - `CardArrow` — trailing → arrow (used in feature)
 *
 * **When to use:**
 * - Any external link that should look like a card tile rather than inline text.
 * - Pair with `CardGrid` when showing multiple cards side by side.
 *
 * **When NOT to use:**
 * - For internal navigation cards — use `NavCard` instead.
 * - For plain inline text links — use a standard `<a>` element.
 */
const meta = {
  title: "Components/LinkCard",
  component: LinkCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["rating", "social", "contact", "feature"],
    },
  },
} satisfies Meta<typeof LinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single rating card — the building block for the ratings row. On the movie
 * detail page these are rendered in a flex container with `min-width: 160px`.
 */
export const Rating: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 16, width: "fit-content" }}>
      <LinkCard
        href="https://letterboxd.com"
        variant="rating"
        aria-label="Letterboxd rating: 4.1 / 5"
      >
        <CardLabel>Letterboxd</CardLabel>
        <CardValue>4.1</CardValue>
        <CardSubtext>/ 5</CardSubtext>
      </LinkCard>
    </div>
  ),
};

/**
 * All three rating sources as they appear on the movie detail page — IMDb,
 * Letterboxd, and Rotten Tomatoes side by side.
 */
export const RatingRow: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        width: "fit-content",
      }}
    >
      <LinkCard
        href="https://imdb.com"
        variant="rating"
        aria-label="IMDb: 8.3 / 10"
      >
        <CardLabel>IMDb</CardLabel>
        <CardValue>
          8.3
          <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.6 }}>
            {" "}
            /10
          </span>
        </CardValue>
        <CardSubtext>567,891 reviews</CardSubtext>
      </LinkCard>
      <LinkCard
        href="https://letterboxd.com"
        variant="rating"
        aria-label="Letterboxd: 4.1 / 5"
      >
        <CardLabel>Letterboxd</CardLabel>
        <CardValue>
          4.1
          <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.6 }}>
            {" "}
            /5
          </span>
        </CardValue>
        <CardSubtext>123,456 reviews</CardSubtext>
      </LinkCard>
      <LinkCard
        href="https://rottentomatoes.com"
        variant="rating"
        aria-label="Rotten Tomatoes: 87% critics"
      >
        <CardLabel>Rotten Tomatoes</CardLabel>
        <CardValue>87%</CardValue>
        <CardSubtext>Critics</CardSubtext>
      </LinkCard>
    </div>
  ),
};

/**
 * Social card as used on the About page to link to Clusterflick social
 * profiles (Letterboxd, Instagram, X, Bluesky, etc.).
 */
export const Social: Story = {
  args: {
    href: "https://letterboxd.com/clusterflick",
    variant: "social",
    "aria-label": "Clusterflick on Letterboxd",
    children: (
      <>
        <CardIcon>
          <LetterboxdIcon aria-hidden="true" />
        </CardIcon>
        <CardContent>@clusterflick</CardContent>
      </>
    ),
  },
};

/** Contact card for the email link on the About page. */
export const Contact: Story = {
  args: {
    href: "mailto:hello@clusterflick.com",
    variant: "contact",
    "aria-label": "Email Clusterflick at hello@clusterflick.com",
    children: (
      <>
        <CardIcon>
          <EmailIcon aria-hidden="true" />
        </CardIcon>
        <CardContent>hello@clusterflick.com</CardContent>
      </>
    ),
  },
};

/**
 * Feature card for describing a data format, open-source project link, or any
 * navigable resource that deserves a larger, more descriptive tile.
 */
export const Feature: Story = {
  args: {
    href: "https://data.clusterflick.com",
    variant: "feature",
    children: (
      <>
        <CardTitle>JSON API</CardTitle>
        <CardDescription>
          Full combined dataset as a compressed JSON file, updated each morning.
        </CardDescription>
        <CardArrow />
      </>
    ),
  },
};

/** All social variants side by side for visual comparison. */
export const SocialRow: Story = {
  args: {
    href: "#",
    variant: "social",
    children: null,
  },
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {[
        { Icon: LetterboxdIcon, label: "Letterboxd", handle: "@clusterflick" },
        { Icon: InstagramIcon, label: "Instagram", handle: "@clusterflick" },
        { Icon: XIcon, label: "X / Twitter", handle: "@clusterflick" },
        { Icon: BlueskyIcon, label: "Bluesky", handle: "@clusterflick.com" },
      ].map(({ Icon, label, handle }) => (
        <LinkCard
          key={label}
          href="#"
          variant="social"
          aria-label={`Clusterflick on ${label}`}
        >
          <CardIcon>
            <Icon aria-hidden="true" />
          </CardIcon>
          <CardContent>{handle}</CardContent>
        </LinkCard>
      ))}
    </div>
  ),
};

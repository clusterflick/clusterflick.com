import type { Meta, StoryObj } from "@storybook/react";
import ProgrammeCard from "@/components/programme-card";

/**
 * `ProgrammeCard` is a clickable card for a festival, film club or film list
 * with films showing. Beside its logo and name it fans out a few posters from
 * what's on and names the next screening, so the card reads as a programme
 * you could go to rather than an organisation's name.
 *
 * **When to use:**
 * - Index pages for festivals, film clubs and film lists, for the entries that
 *   have films showing.
 *
 * **When NOT to use:**
 * - An entry with nothing showing — use `EventCard`, or a `LinkGrid` of names
 *   when there are many.
 * - Venues — use `VenueCard`. Single films — use `FilmPosterGrid`.
 */
const meta = {
  title: "Components/ProgrammeCard",
  component: ProgrammeCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgrammeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const filmCountMeta = (
  <span
    style={{
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-electric-blue)",
      background: "rgba(49, 158, 219, 0.12)",
      padding: "2px 10px",
      borderRadius: 20,
    }}
  >
    12 films
  </span>
);

const posters = [
  { title: "The Godfather", posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" },
  { title: "Pulp Fiction", posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg" },
  { title: "Fight Club", posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
  { title: "Inception", posterPath: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg" },
];

/** A club with a full programme: four posters and the next screening. */
export const Default: Story = {
  args: {
    href: "/film-clubs/bar-trash",
    name: "Bar Trash",
    imagePath: "/images/film-clubs/bar-trash.jpg",
    description:
      "a weekly cult and B-movie film night with themed drinks, from the Token Homo collective",
    posters,
    next: { title: "Possession", when: "Sat 10 Oct" },
    meta: filmCountMeta,
  },
};

/** A single film fans nothing — the poster stands upright. */
export const OnePoster: Story = {
  args: {
    ...Default.args,
    name: "Japanese Film Club",
    imagePath: "/images/film-clubs/japanese-film-club.svg",
    description: "Japanese cinema on the big screen at the Rio Cinema, Dalston",
    posters: posters.slice(0, 1),
    next: { title: "Tampopo", when: "Mon 5 Oct" },
  },
};

/** Films without poster art fall back to the text-pattern poster. */
export const MissingPosterArt: Story = {
  args: {
    ...Default.args,
    posters: [posters[0], { title: "Lost Reel Double Bill" }, posters[2]],
  },
};

/** No logo, no description and no bookable screening — e.g. a sold-out run. */
export const Minimal: Story = {
  args: {
    href: "/festivals/frightfest",
    name: "FrightFest Halloween All-Dayer",
    imagePath: null,
    description: null,
    posters: posters.slice(0, 3),
    next: null,
    meta: filmCountMeta,
  },
};

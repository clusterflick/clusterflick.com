import type { Meta, StoryObj } from "@storybook/react";
import CollectionRow from "@/components/collection-row";

/**
 * `CollectionRow` is a titled, horizontally-scrolling row of collection
 * posters. It matches `PosterRow`'s presentation but links to collection pages
 * rather than individual films.
 *
 * **When to use:**
 * - Surfacing franchises and series on the discovery home page.
 *
 * **When NOT to use:**
 * - Rows of individual films — use `PosterRow`.
 * - A full listing page — use `CollectionCard` in a grid.
 */
const meta = {
  title: "Components/CollectionRow",
  component: CollectionRow,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CollectionRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const collections = [
  {
    collection: {
      id: "1241",
      name: "Harry Potter",
      slug: "harry-potter",
      posterPath: "/eVPs2Y0LyvTLZn6AP5Z6O2rtiGB.jpg",
      partCount: 8,
    },
    showingCount: 3,
  },
  {
    collection: {
      id: "119",
      name: "The Lord of the Rings",
      slug: "the-lord-of-the-rings",
      posterPath: "/pC4hnFrDqYVJTgOoJ2vCVvyWTHF.jpg",
      partCount: 3,
    },
    showingCount: 3,
  },
  {
    collection: {
      id: "230",
      name: "The Godfather",
      slug: "the-godfather",
      posterPath: "/wt2TRBmFmBn5M5j3Yfr5CU4Cprg.jpg",
      partCount: 3,
    },
    showingCount: 2,
  },
  {
    collection: {
      id: "10",
      name: "Star Wars",
      slug: "star-wars",
      posterPath: "/iTQHKziZy9pAAY4hHEDCGPaOvFC.jpg",
      partCount: 9,
    },
    showingCount: 2,
  },
];

export const Default: Story = {
  args: {
    title: "Sagas & Series",
    intro: "Franchises with more than one instalment showing this week.",
    collections,
    seeAllHref: "/collections",
  },
};

/** Without a "see all" link or intro line. */
export const Bare: Story = {
  args: {
    title: "Sagas & Series",
    collections,
  },
};

/** Renders nothing when there are no collections to show. */
export const Empty: Story = {
  args: {
    title: "Sagas & Series",
    collections: [],
  },
};

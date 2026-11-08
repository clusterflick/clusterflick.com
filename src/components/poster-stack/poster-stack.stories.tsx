import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import PosterStack, { type PosterStackItem } from ".";

const POSTERS = [
  { title: "Apocalypse Now", posterPath: "/gQB8Y5RCMkv2zwzFHbUJX3kAhvA.jpg" },
  { title: "Alien", posterPath: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" },
  { title: "Aliens", posterPath: "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg" },
  {
    title: "In the Mood for Love",
    posterPath: "/8BgGbbWiLNhPtkMkN0gGTnbtvBv.jpg",
  },
  {
    title: "We All Loved Each Other So Much",
    posterPath: "/zGGWYpiKNwjpKxelPxOMqJnUgDs.jpg",
  },
  // No artwork: drawn as the title on a patterned card.
  { title: "Killer of Sheep" },
];

function getItems(count: number): PosterStackItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    ...POSTERS[index % POSTERS.length],
  }));
}

function Stack({
  count,
  defaultExpanded,
}: {
  count: number;
  defaultExpanded?: boolean;
}) {
  const items = getItems(count);
  return (
    <PosterStack items={items} label="Seen" defaultExpanded={defaultExpanded}>
      <PosterTileList>
        {items.map((item) => (
          <PosterTile
            key={item.id}
            title={item.title}
            posterPath={item.posterPath}
            href={`/movies/${item.id}`}
          />
        ))}
      </PosterTileList>
    </PosterStack>
  );
}

/**
 * `PosterStack` draws a long list of films as a pile of posters, the whole
 * pile one button. Opening it deals the posters out into the full
 * `PosterTileList`, each flying to its own tile, while the count flies to the
 * top right as the toggle that gathers them back. A second toggle follows the
 * list, for a reader who has scrolled to its end. Pointed at, the pile straightens and says "Click to expand"; on a
 * touch screen it says "Tap to expand" from the start.
 *
 * **When to use:** a long list that isn't the reason for the visit — a
 * reader's Seen list, the watchlist films with no news — where the full grid
 * would push everything after it screens down.
 *
 * **When NOT to use:** anything the reader came to act on, which would then
 * need opening first. A list that fits on one row is drawn as it is, with no
 * pile, so a short list costs nothing.
 *
 * The children must be a `PosterTileList` of the same films in the same order:
 * that's how a poster in the pile finds its tile.
 */
const meta = {
  title: "Components/PosterStack",
  component: Stack,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A long list, closed. */
export const Closed: Story = {
  args: { count: 40 },
};

/** Opened: the full list, with Hide them above and below it. */
export const Expanded: Story = {
  args: { count: 40 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Seen: show all 40 films" }),
    );
    const toggles = await canvas.findAllByRole("button", {
      name: "Seen: hide all 40 films",
    });
    await expect(toggles).toHaveLength(2);
    await expect(canvas.getAllByRole("link")).toHaveLength(40);
  },
};

/** Opened and closed again from the top: back to the pile, focus on it. */
export const Collapsed: Story = {
  args: { count: 40, defaultExpanded: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [toggle] = canvas.getAllByRole("button", {
      name: "Seen: hide all 40 films",
    });
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole("button", { name: "Seen: show all 40 films" }),
    ).toHaveFocus();
  },
};

/** Few enough to fit on a row: the list as it is, with no pile. */
export const Short: Story = {
  args: { count: 3 },
};

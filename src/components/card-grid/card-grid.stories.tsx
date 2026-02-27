import type { Meta, StoryObj } from "@storybook/react";
import CardGrid from "@/components/card-grid";

/**
 * `CardGrid` is a responsive CSS grid wrapper for cards and similar items.
 * It automatically reflows columns based on the available space using
 * `repeat(auto-fill, minmax(...))`.
 *
 * **When to use:**
 * - Anytime you need to lay out a collection of `LinkCard`s, `VenueCard`s, or
 *   similar fixed-size items in a responsive grid.
 * - Use `size` to control how wide each column should be at minimum:
 *   - `"sm"` — compact items like rating badges (min 150px)
 *   - `"md"` — medium items like film posters (min 180px)
 *   - `"lg"` — larger cards like feature/data format cards (min 280px, default)
 * - Use `gap` to control spacing between items.
 *
 * **When NOT to use:**
 * - For single-column layouts — plain `div` + `flex-direction: column` is simpler.
 * - For horizontally scrolling carousels — CSS grid with `auto-fill` wraps, it
 *   does not scroll.
 */
const meta = {
  title: "Components/CardGrid",
  component: CardGrid,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    gap: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof CardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const PlaceholderCard = ({ label }: { label: string }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 12,
      padding: "24px 16px",
      textAlign: "center",
      color: "rgba(255,255,255,0.6)",
      fontSize: 14,
    }}
  >
    {label}
  </div>
);

/** Default large-column grid as used for feature cards on the About page. */
export const Large: Story = {
  args: {
    size: "lg",
    gap: "md",
    children: Array.from({ length: 4 }, (_, i) => (
      <PlaceholderCard key={i} label={`Card ${i + 1}`} />
    )),
  },
};

/** Small-column grid for compact items like rating badges. */
export const Small: Story = {
  args: {
    size: "sm",
    gap: "sm",
    children: Array.from({ length: 6 }, (_, i) => (
      <PlaceholderCard key={i} label={`Rating ${i + 1}`} />
    )),
  },
};

/** Medium-column grid suitable for social link cards. */
export const Medium: Story = {
  args: {
    size: "md",
    gap: "md",
    children: Array.from({ length: 5 }, (_, i) => (
      <PlaceholderCard key={i} label={`Social ${i + 1}`} />
    )),
  },
};

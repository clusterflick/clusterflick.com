import type { Meta, StoryObj } from "@storybook/react";
import NeonLogo from "@/components/neon-logo";

/**
 * `NeonLogo` draws art made as a neon sign on a dark tile, such as the genre
 * icons, and lights it up when the link around it is hovered or focused. The
 * glow is a blurred copy of the sign, so each blooms in its own colours.
 *
 * **When to use:**
 * - Inside a card's link, for neon-sign art. `ProgrammeCard` and `EventCard`
 *   take it through `neonLogo`.
 *
 * **When NOT to use:**
 * - A real organisation's logo, which the glow would wash out.
 */
const meta = {
  title: "Components/NeonLogo",
  component: NeonLogo,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NeonLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unlit, as it sits on a card until the card is hovered. */
export const Unlit: Story = {
  args: { src: "/images/genres/horror.png", size: 96 },
};

/** Lit, as on hover — the skull blooms pink and its eyes blue. */
export const Lit: Story = {
  args: { src: "/images/genres/horror.png", size: 96, lit: true },
};

/** A sign in other colours glows in them. */
export const LitGold: Story = {
  args: { src: "/images/genres/western.png", size: 96, lit: true },
};

/** Inside a link, as the cards use it: hover or tab to it to light it. */
export const InALink: Story = {
  args: { src: "/images/genres/science-fiction.png", size: 96 },
  render: (args) => (
    <a href="#" style={{ display: "inline-block", padding: 24 }}>
      <NeonLogo {...args} />
    </a>
  ),
};

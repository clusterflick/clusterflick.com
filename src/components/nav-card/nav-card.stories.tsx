import type { Meta, StoryObj } from "@storybook/react";
import NavCard from "@/components/nav-card";

/**
 * `NavCard` is a shared wrapper for internal navigation cards. It provides the
 * standard dark surface, border, and lift-and-glow hover animation.
 *
 * Pass a `className` for page-specific layout — padding, border-radius, flex
 * direction. The component itself only provides the hover treatment and link
 * semantics; all interior layout is left to the consumer.
 *
 * **When to use:**
 * - As a base for any navigation card that needs the standard hover style.
 * - `VenueCard` wraps `NavCard` and is the canonical choice for venue listings.
 *
 * **When NOT to use:**
 * - For external links — use `LinkCard` instead.
 * - For non-navigational interactive elements — use `Button`.
 */
const meta = {
  title: "Components/NavCard",
  component: NavCard,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NavCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Basic card with a text label. Hover to see the lift-and-glow animation. */
export const Default: Story = {
  args: { href: "/venues", children: null },
  render: () => (
    <NavCard href="/venues">
      <div style={{ padding: "16px 20px", fontWeight: 600 }}>Browse Venues</div>
    </NavCard>
  ),
};

/** Card with a title and supporting detail — a typical real-world usage. */
export const WithContent: Story = {
  args: { href: "/festivals", children: null },
  render: () => (
    <NavCard href="/festivals">
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>Festivals</div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          8 festivals currently showing
        </div>
      </div>
    </NavCard>
  ),
};

/** Multiple cards side by side — shows consistent hover behaviour across a grid. */
export const CardGrid: Story = {
  args: { href: "#", children: null },
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[
        { href: "/venues", label: "Venues", detail: "240 venues" },
        { href: "/festivals", label: "Festivals", detail: "8 showing" },
        { href: "/london-cinemas", label: "By Borough", detail: "32 boroughs" },
        { href: "/about", label: "About", detail: "Learn more" },
      ].map((item) => (
        <NavCard key={item.href} href={item.href}>
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>{item.detail}</div>
          </div>
        </NavCard>
      ))}
    </div>
  ),
};

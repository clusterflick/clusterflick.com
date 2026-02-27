import type { Meta, StoryObj } from "@storybook/react";
import Button, { ButtonLink } from "@/components/button";

/**
 * `Button` is the standard interactive button component. Use it for actions
 * that do not navigate (toggling state, submitting, dismissing).
 *
 * `ButtonLink` is a Next.js `<Link>` styled identically to a button. Use it
 * for navigation actions.
 *
 * **Variants:**
 * - `"primary"` — main call-to-action (pink/branded fill). Use sparingly — at
 *   most one primary button per view.
 * - `"secondary"` — secondary actions (outlined/transparent). Use alongside
 *   a primary button or on its own for lower-emphasis actions.
 * - `"link"` — plain text with no border or background. Use for subtle
 *   actions like "Show all" toggles.
 *
 * **Sizes:**
 * - `"md"` (default) — standard button size.
 * - `"sm"` — compact size for dense UIs (filter chips, inline controls).
 */
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "link"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Primary call-to-action button. */
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Apply filters",
  },
};

/** Secondary button for lower-emphasis actions. */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Reset",
  },
};

/** Link-style button — no border, no background. */
export const LinkVariant: Story = {
  name: "Link",
  args: {
    variant: "link",
    children: "Show all 24 showings",
  },
};

/** Small primary button for dense/compact contexts. */
export const Small: Story = {
  args: {
    variant: "primary",
    size: "sm",
    children: "Filter",
  },
};

/** Disabled state — applies to all variants. */
export const Disabled: Story = {
  args: {
    variant: "primary",
    children: "Submit",
    disabled: true,
  },
};

/**
 * `ButtonLink` is styled identically to `Button` but renders a Next.js `Link`
 * for client-side navigation. Use for CTAs that navigate to a new route.
 */
export const AsLink: Story = {
  render: () => (
    <ButtonLink href="/venues" variant="primary">
      Browse venues
    </ButtonLink>
  ),
};

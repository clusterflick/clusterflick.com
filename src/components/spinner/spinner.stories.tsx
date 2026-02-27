import type { Meta, StoryObj } from "@storybook/react";
import Spinner from "@/components/spinner";

/**
 * `Spinner` is a low-level animated loading indicator. For most loading states,
 * prefer `LoadingIndicator` which composes this with an accessible label and
 * optional message text.
 *
 * Use `Spinner` directly only when you need a bare spinner without label text
 * (e.g. inline next to a button, or inside a custom loading layout).
 */
const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 16, max: 80, step: 4 },
      description: "Diameter in pixels. Defaults to 40.",
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default size (40px) used in most loading states. */
export const Default: Story = {};

/** Small spinner (28px) for compact contexts such as inline loading states. */
export const Small: Story = {
  args: { size: 28 },
};

/** Large spinner (48px) for full-page loading states. */
export const Large: Story = {
  args: { size: 48 },
};

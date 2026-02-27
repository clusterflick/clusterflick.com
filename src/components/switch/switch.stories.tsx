"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Switch from "@/components/switch";

/**
 * `Switch` is a styled toggle that wraps a hidden checkbox `<input>`. Use it
 * for binary on/off settings where the effect is immediate — no confirmation
 * required.
 *
 * **When to use:**
 * - Single boolean settings (e.g. "Show all showings", "Use current location").
 * - Toggling accessibility filter mode on/off.
 *
 * **When NOT to use:**
 * - Multi-value selections — use `Chip` with `type="radio"` instead.
 * - Actions that require confirmation before applying — use `Button`.
 *
 * **Accessibility:** The underlying input is visually hidden but is fully
 * keyboard-navigable and announced by screen readers via the `<label>`.
 */
const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switch in its off/unchecked state. */
export const Off: Story = {
  args: {
    label: "Show all showings",
    id: "show-all",
    checked: false,
    onChange: () => {},
  },
};

/** Switch in its on/checked state. */
export const On: Story = {
  args: {
    label: "Show all showings",
    id: "show-all",
    checked: true,
    onChange: () => {},
  },
};

/** Interactive switch with real toggle behaviour. */
export const Interactive: Story = {
  args: {
    label: "Use my location",
    id: "interactive-switch",
    checked: false,
    onChange: () => {},
  },
  render: function InteractiveRender() {
    const [checked, setChecked] = useState(false);
    return (
      <Switch
        id="interactive-switch"
        label="Use my location"
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

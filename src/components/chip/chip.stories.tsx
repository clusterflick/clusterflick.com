"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Chip from "@/components/chip";

/**
 * `Chip` is an interactive pill that wraps a hidden `<input>` — either a
 * checkbox or a radio button. It is the building block for the filter overlay.
 *
 * **When to use:**
 * - Filter selections where users toggle categories, genres, or options on/off
 *   (`type="checkbox"`).
 * - Mutually exclusive option sets where only one item can be active at a time
 *   (`type="radio"`).
 * - Use the `count` prop to show how many results match each option.
 *
 * **When NOT to use:**
 * - For display-only labels — use `Tag` instead.
 * - For primary CTA buttons — use `Button`.
 *
 * **Accessibility:** The underlying input is visually hidden but
 * keyboard-accessible. Screen readers announce the label and checked state
 * correctly.
 */
const meta = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["checkbox", "radio"],
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unchecked checkbox chip. */
export const Unchecked: Story = {
  args: {
    type: "checkbox",
    label: "Drama",
    name: "genres",
    checked: false,
    count: 42,
    onChange: () => {},
  },
};

/** Checked checkbox chip showing the active/selected state. */
export const Checked: Story = {
  args: {
    type: "checkbox",
    label: "Drama",
    name: "genres",
    checked: true,
    count: 42,
    onChange: () => {},
  },
};

/** Disabled chip — not selectable (e.g. a genre with zero results). */
export const Disabled: Story = {
  args: {
    type: "checkbox",
    label: "Silent",
    name: "genres",
    checked: false,
    count: 0,
    disabled: true,
    onChange: () => {},
  },
};

/** Interactive group of checkbox chips showing real toggle behaviour. */
export const CheckboxGroup: Story = {
  args: {
    type: "checkbox",
    label: "Movies",
    name: "categories",
    checked: false,
    onChange: () => {},
  },
  render: function CheckboxGroupRender() {
    const options = [
      { label: "Movies", count: 128 },
      { label: "Shorts", count: 14 },
      { label: "Documentary", count: 22 },
      { label: "Comedy", count: 0 },
    ];
    const [selected, setSelected] = useState<Set<string>>(new Set(["Movies"]));
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map(({ label, count }) => (
          <Chip
            key={label}
            type="checkbox"
            name="categories"
            label={label}
            checked={selected.has(label)}
            count={count}
            disabled={count === 0}
            onChange={(checked) => {
              const next = new Set(selected);
              if (checked) next.add(label);
              else next.delete(label);
              setSelected(next);
            }}
          />
        ))}
      </div>
    );
  },
};

/** Interactive radio chips for mutually exclusive options. */
export const RadioGroup: Story = {
  args: {
    type: "radio",
    label: "7 days",
    name: "date-range",
    value: "7 days",
    checked: true,
    onChange: () => {},
  },
  render: function RadioGroupRender() {
    const [value, setValue] = useState("7 days");
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Today", "3 days", "7 days", "2 weeks"].map((opt) => (
          <Chip
            key={opt}
            type="radio"
            name="date-range"
            label={opt}
            value={opt}
            checked={value === opt}
            onChange={setValue}
          />
        ))}
      </div>
    );
  },
};

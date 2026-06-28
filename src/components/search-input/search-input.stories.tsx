"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import SearchInput from "@/components/search-input";
import Button from "@/components/button";

/**
 * `SearchInput` is a rounded text field with a leading magnifying-glass icon
 * and a trailing clear button that appears once the field has a value. It is
 * controlled via `value`/`onChange` and is used both inline at the top of the
 * films list and inside the filter overlay.
 *
 * **When to use:**
 * - Free-text search/filter fields (event titles, performance notes, etc.).
 *
 * **When NOT to use:**
 * - For non-search text input — use a plain `<input>`.
 * - For selecting from a fixed set of options — use `Chip`.
 *
 * **Accessibility:** Pass a descriptive `ariaLabel`; it labels both the input
 * and the clear button. Clearing the field refocuses the input.
 */
const meta = {
  title: "Components/SearchInput",
  component: SearchInput,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Render with local state so the controlled input updates in stories. */
const Controlled: Story["render"] = (args) => {
  const [value, setValue] = useState(args.value);
  return (
    <div style={{ width: 360 }}>
      <SearchInput {...args} value={value} onChange={setValue} />
    </div>
  );
};

const baseArgs = {
  id: "story-search",
  placeholder: "Search event title...",
  ariaLabel: "Search event title",
  onChange: () => {},
};

/** Empty field — no clear button is shown. */
export const Empty: Story = {
  args: { ...baseArgs, value: "" },
  render: Controlled,
};

/** With a value — the clear button appears on the right. */
export const WithValue: Story = {
  args: { ...baseArgs, value: "Barbie" },
  render: Controlled,
};

/**
 * With a `trailing` slot — extra controls (here a button) sit inside the pill,
 * to the right of the clear button.
 */
export const WithTrailing: Story = {
  args: {
    ...baseArgs,
    value: "Barbie",
    trailing: (
      <Button variant="secondary" size="sm">
        More Filters
      </Button>
    ),
  },
  render: Controlled,
};

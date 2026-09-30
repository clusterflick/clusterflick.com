"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Slider from "@/components/slider";

/**
 * `Slider` picks one number from a continuous range — a threshold, where each
 * step is a small change and a reader wants to feel for the right cut.
 *
 * **When to use:** a minimum or maximum along a scale with no natural stops,
 * like a rating. The films grid's Letterboxd rating filter uses it, with its
 * lowest position meaning "Any rating".
 *
 * **When NOT to use:** a handful of named options (use `Chip` as radios); an
 * on/off setting (use `Switch`); a range with two ends (this has one thumb).
 *
 * **Accessibility:** a native `<input type="range">`, so arrow keys, Page
 * Up/Down, Home/End and touch dragging all work, and the formatted value is
 * announced through `aria-valuetext` rather than the raw number.
 */
const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  const isAny = value < 2.95;
  return (
    <div style={{ maxWidth: 360 }}>
      <Slider
        id="story-rating"
        label="Letterboxd rating"
        min={2.9}
        max={4.5}
        step={0.1}
        value={value}
        onChange={setValue}
        formatValue={(v) => (v < 2.95 ? "Any rating" : `${v.toFixed(1)}+`)}
        muted={isAny}
      />
    </div>
  );
}

const args = {
  id: "story-rating",
  label: "Letterboxd rating",
  min: 2.9,
  max: 4.5,
  step: 0.1,
  value: 4,
  onChange: () => {},
  formatValue: (v: number) => (v < 2.95 ? "Any rating" : `${v.toFixed(1)}+`),
};

/** Set to the Highly Rated row's threshold. */
export const AtThreshold: Story = {
  args,
  render: () => <Interactive initial={4} />,
};

/**
 * At its lowest position, which the rating filter reads as no filter, so the
 * value is muted.
 */
export const AnyRating: Story = {
  args: { ...args, value: 2.9, muted: true },
  render: () => <Interactive initial={2.9} />,
};

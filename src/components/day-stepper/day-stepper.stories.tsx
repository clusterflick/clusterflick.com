import type { Meta, StoryObj } from "@storybook/react";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import DayStepper from ".";

/**
 * `DayStepper` moves through a range one day at a time — the planner's day
 * control.
 *
 * **When to use:** a view that shows exactly one day and lets the reader step
 * to the neighbouring ones within a bounded range.
 *
 * **When NOT to use:** to choose a range, or to jump to an arbitrary date. That
 * is the date filter's job; this only moves within whatever range it set.
 *
 * At each end of the range the control is disabled rather than hidden, so the
 * day label never shifts sideways and the reader can see why they can go no
 * further.
 */
const meta = {
  title: "Components/DayStepper",
  component: DayStepper,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: {
    onPrevious: () => {},
    onNext: () => {},
  },
} satisfies Meta<typeof DayStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const TODAY = getLondonMidnightTimestamp();

/** Mid-range: both directions available. */
export const Default: Story = {
  args: { day: TODAY + MS_PER_DAY, hasPrevious: true, hasNext: true },
};

/** With a detail after the relative day, as the planner shows its count. */
export const WithDetail: Story = {
  args: {
    day: TODAY + MS_PER_DAY,
    hasPrevious: true,
    hasNext: true,
    detail: "108 films",
  },
};

/** The first day of the range: previous is disabled. */
export const StartOfRange: Story = {
  args: { day: TODAY, hasPrevious: false, hasNext: true },
};

/** The last day of the range: next is disabled. */
export const EndOfRange: Story = {
  args: { day: TODAY + 7 * MS_PER_DAY, hasPrevious: true, hasNext: false },
};

/** Beyond ten days out there is no relative label, only the date. */
export const FarOut: Story = {
  args: { day: TODAY + 30 * MS_PER_DAY, hasPrevious: true, hasNext: true },
};

/** A single-day range: both directions disabled. */
export const SingleDay: Story = {
  args: { day: TODAY, hasPrevious: false, hasNext: false },
};

/**
 * Mobile is the constraining width; the control must stay on one line. Below
 * ~250px of label the date shortens ("Wed 30 Sept") rather than truncating.
 */
export const Narrow: Story = {
  args: { day: TODAY + 3 * MS_PER_DAY, hasPrevious: true, hasNext: true },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

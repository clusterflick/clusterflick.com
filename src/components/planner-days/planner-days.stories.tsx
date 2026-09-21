import type { Meta, StoryObj } from "@storybook/react";
import PlannerDays from ".";

/**
 * `PlannerDays` is a film's week at a glance in the planner: one dot per day,
 * filled where the film is showing and ringed on the day in view.
 *
 * **When to use:** beside a single day's listing, to answer "if not today,
 * when?" without stepping through the days one by one.
 *
 * **When NOT to use:** anywhere every day's showings are already listed, such
 * as the listing page — the strip would only repeat them.
 *
 * Showing days are buttons that move to that day. Each end shows whether the
 * date range stops there (a bar) or carries on past what is shown (dots, blue
 * when the film is showing out there too).
 */
const meta = {
  title: "Components/PlannerDays",
  component: PlannerDays,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: { onSelect: () => {} },
} satisfies Meta<typeof PlannerDays>;

export default meta;
type Story = StoryObj<typeof meta>;

// Monday 21 to Sunday 27 September 2026.
const WEEK = [
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
];

/** Showing later in the week, viewed on the first of those days; the range
 * carries on past the last. */
export const Default: Story = {
  args: {
    days: WEEK,
    showing: new Set(["2026-09-25", "2026-09-26", "2026-09-27"]),
    selected: "2026-09-25",
    continuesAfter: true,
  },
};

/** Mid-range: the date range carries on at both ends, and the film is on
 * again after these days (blue) but not before them. */
export const MidRange: Story = {
  args: {
    days: WEEK,
    showing: new Set(["2026-09-22", "2026-09-24"]),
    selected: "2026-09-22",
    continuesBefore: true,
    continuesAfter: true,
    moreAfter: true,
  },
};

/** Only the day in view. */
export const OneDay: Story = {
  args: {
    days: WEEK,
    showing: new Set(["2026-09-23"]),
    selected: "2026-09-23",
  },
};

/** Every day of the week. */
export const EveryDay: Story = {
  args: {
    days: WEEK,
    showing: new Set(WEEK),
    selected: "2026-09-21",
    continuesAfter: true,
  },
};

/** A date range shorter than a week shows only its own days. */
export const ShortRange: Story = {
  args: {
    days: WEEK.slice(0, 3),
    showing: new Set(["2026-09-21", "2026-09-23"]),
    selected: "2026-09-21",
  },
};

/** A fortnight, as wider screens show. */
export const Fortnight: Story = {
  args: {
    days: [
      ...WEEK,
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ],
    showing: new Set(["2026-09-22", "2026-09-29", "2026-10-02", "2026-10-03"]),
    selected: "2026-09-22",
    continuesAfter: true,
    moreAfter: true,
  },
};

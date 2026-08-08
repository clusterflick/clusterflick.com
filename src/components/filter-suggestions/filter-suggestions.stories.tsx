import type { Meta, StoryObj } from "@storybook/react";
import FilterSuggestions from "@/components/filter-suggestions";
import { filterManager, type FilterSuggestion } from "@/lib/filters";

const state = filterManager.getDefaultState();

const suggestion = (
  partial: Omit<FilterSuggestion, "state">,
): FilterSuggestion => ({ ...partial, state });

/**
 * `FilterSuggestions` lists the cheapest changes that would turn an empty
 * filtered view into a populated one. It renders the output of
 * `suggestFilterRelaxations`.
 *
 * **Each offer stacks two kinds of line:**
 * - The **headline** says what taking the offer does, phrased as something you
 *   can act on — a question, an instruction, or the films themselves. A bare
 *   filter name ("Any date") reads as a caption rather than a button, so a
 *   widening-only offer names the films it would reveal instead.
 * - One **change line** per filter touched, `Label: detail`, where the detail
 *   is read off the probe result. One line each rather than a run-on phrase:
 *   joining them produced "Did you mean “X”?, any date", with a comma after a
 *   question mark and the second change buried at the end of the first.
 *
 * **Three kinds of offer:**
 * - `redirect` (yellow) — the same query matched against a different search
 *   field. Concedes nothing, so it ranks above everything else.
 * - `correct` (purple) — a near-miss title replacing the query. Puts words in
 *   the reader's mouth, so it ranks below a redirect, and only ever appears
 *   when the query as typed matches nothing anywhere.
 * - `widen` (blue) — a filter given up, ordered by how little it costs the user
 *   to lose it. Accessibility ranks last and is never combined with another
 *   change, because it is a requirement rather than a preference.
 *
 * **When to use:**
 * - Inside an `EmptyState`'s `actions` slot, when a filtered grid or list
 *   returns zero results but the dataset itself is not empty.
 *
 * **When NOT to use:**
 * - As a general filter control — the filter overlay is where filters are set.
 *   These are one-tap escapes from a dead end, not a second filter panel.
 * - When the dataset is genuinely empty; there is nothing to suggest, so show a
 *   plain `EmptyState` instead.
 */
const meta = {
  title: "Components/FilterSuggestions",
  component: FilterSuggestions,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  args: {
    onApply: () => {},
  },
} satisfies Meta<typeof FilterSuggestions>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A widening on its own. With only a couple of films behind it, naming them
 * says far more than "Any date" would.
 */
export const SingleWidening: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "widen:dateRange",
        kind: "widen",
        headline: "Show “Eternal Sunshine of the Spotless Mind”",
        changes: [{ label: "Any date", detail: "next showing in 8 days" }],
        count: 1,
      }),
    ],
  },
};

/**
 * Past a couple of results the headline names what it can and counts the rest.
 * Ordered by elasticity, not by count — which is why "any accessibility
 * requirement" sits last despite freeing up the most results.
 */
export const MultipleWidenings: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "widen:dateRange",
        kind: "widen",
        headline: "Show “Eternal Sunshine…” & “Little Miss Sunshine”",
        changes: [{ label: "Any date", detail: "next showing in 8 days" }],
        count: 2,
      }),
      suggestion({
        id: "widen:venues",
        kind: "widen",
        headline: "Show “Aftersun” & 29 more",
        changes: [
          { label: "All venues", detail: "at BFI Southbank & 34 more venues" },
        ],
        count: 30,
      }),
      suggestion({
        id: "widen:accessibility",
        kind: "widen",
        headline: "Show “Perfect Days” & 12 more",
        changes: [{ label: "Any accessibility requirement" }],
        count: 13,
      }),
    ],
  },
};

/** The query was typed into the wrong search box. Nothing is given up. */
export const Redirect: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "redirect:search:showingTitleSearch",
        kind: "redirect",
        headline: "Search original venue titles instead",
        changes: [
          {
            label: "Original venue title",
            detail: "“Loved & Wanted: Community Film Screening”",
          },
        ],
        count: 1,
      }),
    ],
  },
};

/** Redirects rank above everything, so they take the top slots. */
export const RedirectAndWidening: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "redirect:search:showingTitleSearch",
        kind: "redirect",
        headline: "Search original venue titles instead",
        changes: [
          {
            label: "Original venue title",
            detail: "“Loved & Wanted: Community Film Screening”",
          },
        ],
        count: 4,
      }),
      suggestion({
        id: "redirect:search:performanceNotesSearch",
        kind: "redirect",
        headline: "Search performance notes instead",
        changes: [{ label: "Performance note", detail: "“Presented in 70mm”" }],
        count: 2,
      }),
      suggestion({
        id: "widen:categories",
        kind: "widen",
        headline: "Show “Mr Tickle” & “Bagpuss”",
        changes: [{ label: "All event types", detail: "found in TV" }],
        count: 2,
      }),
    ],
  },
};

/**
 * When no single change is enough, both are stated — each on its own line, so
 * neither hides at the end of the other.
 */
export const CombinedPair: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "redirect:search:showingTitleSearch+widen:dateRange",
        kind: "redirect",
        headline: "Search original venue titles instead",
        changes: [
          {
            label: "Original venue title",
            detail: "“Loved & Wanted: Community Film Screening”",
          },
          { label: "Any date", detail: "next showing in 11 days" },
        ],
        count: 1,
      }),
    ],
  },
};

/**
 * The query was mistyped. A correction touches no filter, so it carries no
 * change lines at all — the next showing date belongs to a date widening, and
 * reporting it here would imply the window had moved when it had not.
 */
export const Correction: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "correct:Akira",
        kind: "correct",
        headline: "Did you mean “Akira”?",
        changes: [],
        count: 1,
      }),
    ],
  },
};

/**
 * A correction paired with a widening — the corrected title is *also* outside
 * the date window, so neither change alone would have found it.
 */
export const CorrectionAndWidening: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "correct:Little Miss Sunshine+widen:dateRange",
        kind: "correct",
        headline: "Did you mean “Little Miss Sunshine”?",
        changes: [{ label: "Any date", detail: "next showing in 8 days" }],
        count: 1,
      }),
      suggestion({
        id: "correct:Eternal Sunshine of the Spotless Mind",
        kind: "correct",
        headline: "Did you mean “Eternal Sunshine of the Spotless Mind”?",
        changes: [],
        count: 3,
      }),
    ],
  },
};

/** All three kinds at once, in rank order: redirect, correction, widening. */
export const AllKinds: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "redirect:search:performanceNotesSearch",
        kind: "redirect",
        headline: "Search performance notes instead",
        changes: [{ label: "Performance note", detail: "“Watchword”" }],
        count: 5,
      }),
      suggestion({
        id: "correct:Words",
        kind: "correct",
        headline: "Did you mean “Words”?",
        changes: [],
        count: 1,
      }),
      suggestion({
        id: "widen:dateRange+widen:categories",
        kind: "widen",
        headline: "Show “Words”",
        changes: [
          { label: "Any date", detail: "next showing in 12 days" },
          { label: "All event types", detail: "found in TV" },
        ],
        count: 1,
      }),
    ],
  },
};

/**
 * Original venue titles run long. Every line ellipsises rather than wrapping or
 * pushing the count off the row.
 */
export const LongDetail: Story = {
  args: {
    suggestions: [
      suggestion({
        id: "redirect:search:showingTitleSearch",
        kind: "redirect",
        headline: "Search original venue titles instead",
        changes: [
          {
            label: "Original venue title",
            detail:
              "“Loved & Wanted: Community Film Screening & Memory Workshop, followed by a Q&A”",
          },
        ],
        count: 1,
      }),
    ],
  },
};

/** Nothing rescues the query — the component renders nothing at all. */
export const NoSuggestions: Story = {
  args: {
    suggestions: [],
  },
};

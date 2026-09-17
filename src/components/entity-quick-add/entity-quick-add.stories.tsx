"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import EntityQuickAdd, {
  EntityQuickAddItem,
} from "@/components/entity-quick-add";

/**
 * `EntityQuickAdd` is a search-and-toggle combobox for adding or removing one
 * named thing from a filter. Type to search, then pick a suggestion to flip its
 * inclusion; each suggestion shows whether it is already selected and how many
 * films it accounts for. Picking closes the menu and clears the query, ready
 * for the next search.
 *
 * It owns no selection state — `isSelected` and `onToggle` keep it in lockstep
 * with whatever renders the current selection (chips, a grouped list).
 *
 * **When to use:**
 * - Any filter whose vocabulary is too large to enumerate as chips. Venues
 *   (~400), directors (~1,300) and cast (~11,000) all use it.
 *
 * **When NOT to use:**
 * - Small fixed vocabularies — genres, formats, event types. A chip list shows
 *   every option at once and is a better fit.
 * - Browsing rather than finding. There is no way to see the whole list here.
 *
 * **Matching** is a plain case-insensitive substring, never fuzzy: the reader
 * is typing a name they already have in mind, and an edit budget over eleven
 * thousand cast names would put a different Anderson at the top of every list.
 * Results stop at `maxResults` in list order, so callers should pass the
 * best-represented entries first.
 *
 * **Accessibility:** Built on Downshift's `useCombobox`, so it exposes a proper
 * combobox/listbox with `aria-activedescendant`, arrow-key navigation, and
 * Enter/Escape handling. Each option announces its selected state.
 */
const meta = {
  title: "Components/EntityQuickAdd",
  component: EntityQuickAdd,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EntityQuickAdd>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_DIRECTORS: EntityQuickAddItem[] = [
  { id: "d1", name: "Claude Chabrol", count: 21 },
  { id: "d2", name: "Billy Wilder", count: 20 },
  { id: "d3", name: "Roger Corman", count: 16 },
  { id: "d4", name: "Martin Scorsese", count: 12 },
  { id: "d5", name: "Andrzej Żuławski", count: 10 },
  { id: "d6", name: "Ridley Scott", count: 7 },
  { id: "d7", name: "Christopher Nolan", count: 7 },
  { id: "d8", name: "David Lynch", count: 7 },
  { id: "d9", name: "Steven Spielberg", count: 6 },
  { id: "d10", name: "Lynne Ramsay", count: 3 },
];

const SAMPLE_VENUES: EntityQuickAddItem[] = [
  { id: "prince-charles", name: "Prince Charles Cinema", count: 48 },
  { id: "bfi-southbank", name: "BFI Southbank", count: 62 },
  { id: "bfi-imax", name: "BFI IMAX", count: 12 },
  { id: "cineworld-wandsworth", name: "Cineworld — Wandsworth", count: 34 },
  { id: "cineworld-wembley", name: "Cineworld — Wembley", count: 30 },
  { id: "rio-cinema", name: "Rio Cinema", count: 25 },
];

function Interactive({
  items,
  initial,
  placeholder,
  ariaLabel,
  inputId,
}: {
  items: EntityQuickAddItem[];
  initial: string[];
  placeholder: string;
  ariaLabel: string;
  inputId: string;
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  return (
    <div style={{ maxWidth: 520 }}>
      <EntityQuickAdd
        items={items}
        isSelected={(id) => selected.includes(id)}
        onToggle={(id) =>
          setSelected((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
          )
        }
        inputId={inputId}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
      />
      <p style={{ marginTop: 16, color: "#9aa0b4", fontSize: 13 }}>
        Selected: {selected.length ? selected.join(", ") : "none"}
      </p>
    </div>
  );
}

/**
 * The directors filter. Try typing "scott" — it matches both Ridley Scott and
 * a surname inside another name, which is why picking is explicit rather than
 * automatic.
 */
export const Directors: Story = {
  args: {
    items: SAMPLE_DIRECTORS,
    isSelected: () => false,
    onToggle: () => {},
    inputId: "story-directors",
    placeholder: "Search for a director…",
    ariaLabel: "Search for a director",
  },
  render: () => (
    <Interactive
      items={SAMPLE_DIRECTORS}
      initial={["d4"]}
      inputId="story-directors"
      placeholder="Search for a director…"
      ariaLabel="Search for a director"
    />
  ),
};

/**
 * The same control against the venue vocabulary, where it started. Try "cine"
 * or "bfi".
 */
export const Venues: Story = {
  args: {
    items: SAMPLE_VENUES,
    isSelected: () => false,
    onToggle: () => {},
    inputId: "story-venues",
    placeholder: "Quick toggle a venue…",
    ariaLabel: "Quick toggle a venue",
  },
  render: () => (
    <Interactive
      items={SAMPLE_VENUES}
      initial={["bfi-southbank"]}
      inputId="story-venues"
      placeholder="Quick toggle a venue…"
      ariaLabel="Quick toggle a venue"
    />
  ),
};

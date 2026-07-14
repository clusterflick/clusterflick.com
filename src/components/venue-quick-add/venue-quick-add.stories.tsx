"use client";

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import VenueQuickAdd, { VenueQuickAddItem } from "@/components/venue-quick-add";

/**
 * `VenueQuickAdd` is a search-and-toggle combobox for adding or removing a
 * single venue from the filter without scrolling the grouped venue list. Type
 * to search, then pick a suggestion to flip its inclusion; each suggestion
 * shows whether the venue is already selected. Picking closes the menu and
 * clears the query, ready for the next search.
 *
 * **When to use:**
 * - Alongside broad "quick filter" pills (all / cinemas / near me) to give a
 *   precise, single-venue add/remove path.
 *
 * **When NOT to use:**
 * - For bulk selection or browsing every venue — use the grouped chip list.
 * - For non-venue searches — it is coupled to the venue filter model.
 *
 * **Accessibility:** Built on Downshift's `useCombobox`, so it exposes a proper
 * combobox/listbox with `aria-activedescendant`, arrow-key navigation, and
 * Enter/Escape handling. Each option announces its selected state.
 */
const meta = {
  title: "Components/VenueQuickAdd",
  component: VenueQuickAdd,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof VenueQuickAdd>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_VENUES: VenueQuickAddItem[] = [
  { id: "prince-charles", name: "Prince Charles Cinema", count: 48 },
  { id: "bfi-southbank", name: "BFI Southbank", count: 62 },
  { id: "bfi-imax", name: "BFI IMAX", count: 12 },
  { id: "castle-cinema", name: "The Castle Cinema", count: 21 },
  { id: "cineworld-wandsworth", name: "Cineworld — Wandsworth", count: 34 },
  { id: "cineworld-wembley", name: "Cineworld — Wembley", count: 30 },
  { id: "everyman-kings-cross", name: "Everyman — King's Cross", count: 18 },
  { id: "everyman-baker-street", name: "Everyman — Baker Street", count: 16 },
  { id: "rio-cinema", name: "Rio Cinema", count: 25 },
  { id: "genesis-cinema", name: "Genesis Cinema", count: 27 },
];

/**
 * Interactive example holding selection state locally so the toggle and
 * selected-indicator behaviour are exercisable. Try typing "cine" or "bfi".
 */
export const Default: Story = {
  args: {
    venues: SAMPLE_VENUES,
    isVenueSelected: () => false,
    onToggleVenue: () => {},
  },
  render: () => {
    const InteractiveQuickAdd = () => {
      const [selected, setSelected] = useState<string[]>(["bfi-southbank"]);
      return (
        <div style={{ maxWidth: 520 }}>
          <VenueQuickAdd
            venues={SAMPLE_VENUES}
            isVenueSelected={(id) => selected.includes(id)}
            onToggleVenue={(id) =>
              setSelected((prev) =>
                prev.includes(id)
                  ? prev.filter((v) => v !== id)
                  : [...prev, id],
              )
            }
          />
          <p style={{ marginTop: 16, color: "#9aa0b4", fontSize: 13 }}>
            Selected: {selected.length ? selected.join(", ") : "none"}
          </p>
        </div>
      );
    };
    return <InteractiveQuickAdd />;
  },
};

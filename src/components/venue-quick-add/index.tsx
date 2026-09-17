"use client";

import { Ref } from "react";
import EntityQuickAdd, {
  EntityQuickAddHandle,
  EntityQuickAddItem,
} from "@/components/entity-quick-add";

export type VenueQuickAddItem = EntityQuickAddItem;

/** Imperative handle for parents to focus the search input (e.g. from the
 * "Custom" venue pill). */
export type VenueQuickAddHandle = EntityQuickAddHandle;

interface VenueQuickAddProps {
  /** Flat list of all selectable venues, with full names. */
  venues: VenueQuickAddItem[];
  /** Whether a venue is currently included in the filter. */
  isVenueSelected: (venueId: string) => boolean;
  /** Toggle a venue's inclusion. Called on pick, then the input clears. */
  onToggleVenue: (venueId: string) => void;
  /** Max suggestions shown at once. */
  maxResults?: number;
  /** Optional handle exposing `focus()` for the underlying search input. */
  ref?: Ref<VenueQuickAddHandle>;
}

/**
 * A search-and-toggle combobox for adding or removing a single venue from the
 * filter without scrolling the grouped list.
 *
 * The behaviour lives in {@link EntityQuickAdd}, which the people filters share;
 * this is the venue-shaped door onto it, keeping the venue vocabulary in the
 * prop names where the venue filter section reads them.
 */
export default function VenueQuickAdd({
  venues,
  isVenueSelected,
  onToggleVenue,
  maxResults,
  ref,
}: VenueQuickAddProps) {
  return (
    <EntityQuickAdd
      items={venues}
      isSelected={isVenueSelected}
      onToggle={onToggleVenue}
      inputId="venue-quick-add-input"
      placeholder="Quick toggle a venue…"
      ariaLabel="Quick toggle a venue"
      maxResults={maxResults}
      ref={ref}
    />
  );
}

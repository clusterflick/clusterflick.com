"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { VenueOption, VENUE_OPTIONS } from "@/state/filter-config-context";
import { VenueGroup } from "@/hooks/use-venue-groups";
import Button from "@/components/button";
import Chip from "@/components/chip";
import ExpandableSection from "@/components/expandable-section";
import SearchInput from "@/components/search-input";
import VenueQuickAdd, {
  VenueQuickAddHandle,
} from "@/components/venue-quick-add";
import { getVenueDisplayName } from "@/utils/get-venue-display-name";
import styles from "./filter-overlay.module.css";

interface VenueFilterSectionProps {
  venueGroups: VenueGroup[];
  allVenueIds: string[];
  cinemaVenueIds: string[];
  smallScreeningVenueIds: string[];
  nearbyVenueIds: string[];
  selectedVenues: string[] | null;
  geoLoading: boolean;
  geoError: string | null;
  onVenueOptionChange: (option: VenueOption, venueIds: string[]) => void;
  onNearbyClick: () => void;
  toggleVenue: (venueId: string, allVenueIds: string[]) => void;
  selectVenues: (venueIds: string[]) => void;
  clearVenues: () => void;
}

export default function VenueFilterSection({
  venueGroups,
  allVenueIds,
  cinemaVenueIds,
  smallScreeningVenueIds,
  nearbyVenueIds,
  selectedVenues,
  geoLoading,
  geoError,
  onVenueOptionChange,
  onNearbyClick,
  toggleVenue,
  selectVenues,
  clearVenues,
}: VenueFilterSectionProps) {
  const [venueSearchQuery, setVenueSearchQuery] = useState("");
  const quickAddRef = useRef<VenueQuickAddHandle>(null);

  // Focus the quick-add input on the next frame. Deferring past the current
  // click lets the tapped radio settle first, so focus reliably lands on the
  // input rather than being reclaimed by the pill.
  const focusQuickAdd = () => {
    requestAnimationFrame(() => quickAddRef.current?.focus());
  };

  // Filter venue groups based on search query
  const filteredVenueGroups = useMemo(() => {
    if (!venueSearchQuery.trim()) return venueGroups;

    const query = venueSearchQuery.toLowerCase().trim();
    return venueGroups
      .map((group) => ({
        ...group,
        venues: group.venues.filter((venue) =>
          venue.name.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.venues.length > 0);
  }, [venueGroups, venueSearchQuery]);

  const hasVenueSearchFilter = venueSearchQuery.trim().length > 0;

  // Flat list of every venue (full names) for the quick-add combobox. Unlike
  // the grouped chips, names are kept intact so near-duplicates stay
  // distinguishable in a flat suggestion list.
  const allVenues = useMemo(
    () =>
      venueGroups.flatMap((group) =>
        group.venues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          count: venue.count,
        })),
      ),
    [venueGroups],
  );

  // Get count for a venue option chip
  const getVenueOptionCount = (option: VenueOption): number | undefined => {
    const counts: Record<VenueOption, number | undefined> = {
      all: allVenueIds.length,
      cinemas: cinemaVenueIds.length,
      small: smallScreeningVenueIds.length,
      nearby: nearbyVenueIds.length > 0 ? nearbyVenueIds.length : undefined,
      // No count badge — "custom" is a bespoke selection, not a fixed set.
      custom: undefined,
    };
    return counts[option];
  };

  // Helper to check if a venue is selected
  const isVenueSelected = (venueId: string) => {
    if (selectedVenues === null) return true;
    return selectedVenues.includes(venueId);
  };

  // Determine current venue option. Falls back to "custom" when the selection
  // matches none of the presets (including a hand-picked or empty selection),
  // so the pill row always reflects an active option instead of a dead state.
  const currentVenueOption: VenueOption = useMemo(() => {
    // All venues selected (null means no filter = all)
    if (selectedVenues === null) return "all";
    // Check if current selection matches cinema venues exactly
    if (
      cinemaVenueIds.length > 0 &&
      selectedVenues.length === cinemaVenueIds.length &&
      selectedVenues.every((id) => cinemaVenueIds.includes(id))
    ) {
      return "cinemas";
    }
    // Check if current selection matches small screening venues exactly
    if (
      smallScreeningVenueIds.length > 0 &&
      selectedVenues.length === smallScreeningVenueIds.length &&
      selectedVenues.every((id) => smallScreeningVenueIds.includes(id))
    ) {
      return "small";
    }
    // Check if current selection matches nearby venues exactly
    if (
      nearbyVenueIds.length > 0 &&
      selectedVenues.length === nearbyVenueIds.length &&
      selectedVenues.every((id) => nearbyVenueIds.includes(id))
    ) {
      return "nearby";
    }
    return "custom";
  }, [selectedVenues, cinemaVenueIds, smallScreeningVenueIds, nearbyVenueIds]);

  return (
    <section className={styles.section} aria-labelledby="venues-heading">
      <div className={styles.sectionHeader}>
        <h3 id="venues-heading" className={styles.sectionTitle}>
          Venues
        </h3>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={() => clearVenues()}
            disabled={selectedVenues === null}
            aria-label="Select all venues"
          >
            Select All
          </Button>
          <span className={styles.controlDivider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={() => selectVenues([])}
            disabled={selectedVenues !== null && selectedVenues.length === 0}
            aria-label="Clear all venues"
          >
            Clear All
          </Button>
        </div>
      </div>
      <p className={styles.sectionDescription}>
        Choose which venues to include.
        <br />
        <Link href="/venues" className={styles.sectionLink}>
          See a list of all venues
        </Link>
      </p>
      <div
        className={styles.chipGroup}
        role="radiogroup"
        aria-label="Venue quick filters"
      >
        {VENUE_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            type="radio"
            name="venue-option"
            label={value === "nearby" && geoLoading ? "Locating..." : label}
            value={value}
            count={getVenueOptionCount(value)}
            checked={currentVenueOption === value}
            disabled={value === "nearby" && geoLoading}
            onChange={(v) => {
              const option = v as VenueOption;
              if (option === "all") {
                clearVenues();
              } else if (option === "cinemas") {
                onVenueOptionChange(option, cinemaVenueIds);
              } else if (option === "small") {
                onVenueOptionChange(option, smallScreeningVenueIds);
              } else if (option === "nearby") {
                onNearbyClick();
              } else if (option === "custom") {
                // onChange only fires when switching *into* Custom from a
                // preset, so this clear is never destructive to an existing
                // custom selection. Focus is handled by onClick (which also
                // fires when Custom is already active).
                selectVenues([]);
              }
            }}
            onClick={
              value === "custom"
                ? // Fires on every tap of the Custom pill — including when it's
                  // already active — so the quick-add input is focused whether
                  // or not the selection just changed.
                  focusQuickAdd
                : undefined
            }
          />
        ))}
      </div>
      {geoError && (
        <p className={styles.geoError} role="alert">
          {geoError}
        </p>
      )}
      <VenueQuickAdd
        ref={quickAddRef}
        venues={allVenues}
        isVenueSelected={isVenueSelected}
        onToggleVenue={(venueId) => toggleVenue(venueId, allVenueIds)}
      />
      <ExpandableSection title="Select Specific Venues">
        <div className={styles.advancedFilters}>
          {/* Venue search filter */}
          <SearchInput
            id="venue-filter-search"
            className={styles.venueSearchWrapper}
            placeholder="Filter venues..."
            ariaLabel="Filter venues"
            value={venueSearchQuery}
            onChange={setVenueSearchQuery}
          />

          {filteredVenueGroups.map((group) => {
            const groupVenueIds = group.venues.map((v) => v.id);
            const allGroupSelected =
              selectedVenues === null ||
              groupVenueIds.every((id) => selectedVenues.includes(id));
            const noneGroupSelected =
              selectedVenues !== null &&
              groupVenueIds.every((id) => !selectedVenues.includes(id));

            const selectAllInGroup = () => {
              if (selectedVenues === null) {
                // Already all selected, do nothing
                return;
              }
              const newSelection = [...selectedVenues];
              groupVenueIds.forEach((id) => {
                if (!newSelection.includes(id)) {
                  newSelection.push(id);
                }
              });
              // If all venues now selected, clear to represent "all"
              if (newSelection.length === allVenueIds.length) {
                clearVenues();
              } else {
                selectVenues(newSelection);
              }
            };

            const clearAllInGroup = () => {
              if (selectedVenues === null) {
                // Currently all selected, select all except this group
                const allExceptGroup = allVenueIds.filter(
                  (id) => !groupVenueIds.includes(id),
                );
                selectVenues(allExceptGroup);
              } else {
                const newSelection = selectedVenues.filter(
                  (id) => !groupVenueIds.includes(id),
                );
                selectVenues(newSelection);
              }
            };

            return (
              <div key={group.id} className={styles.advancedFilterGroup}>
                <div className={styles.advancedFilterHeader}>
                  <h4 className={styles.advancedFilterTitle}>
                    {group.label}{" "}
                    <span className={styles.venueGroupCount}>
                      ({group.venues.length})
                    </span>
                  </h4>
                  {!hasVenueSearchFilter && group.venues.length > 3 && (
                    <div className={styles.selectionControls}>
                      <Button
                        variant="link"
                        onClick={selectAllInGroup}
                        disabled={allGroupSelected}
                        aria-label={`Select all ${group.label} venues`}
                      >
                        Select All
                      </Button>
                      <span className={styles.controlDivider}>/</span>
                      <Button
                        variant="link"
                        onClick={clearAllInGroup}
                        disabled={noneGroupSelected}
                        aria-label={`Clear all ${group.label} venues`}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
                <div className={styles.chipGroup} role="group">
                  {group.venues.map((venue) => {
                    // For group-structured venues, strip the redundant group
                    // name (and any configured extra) prefix from the name.
                    const isGroupStructured = group.id.startsWith("group-");
                    const displayName = isGroupStructured
                      ? getVenueDisplayName(venue.name, group.label)
                      : venue.name;
                    return (
                      <Chip
                        key={venue.id}
                        type="checkbox"
                        name="venue"
                        label={displayName}
                        count={venue.count}
                        checked={isVenueSelected(venue.id)}
                        onChange={() => toggleVenue(venue.id, allVenueIds)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ExpandableSection>
    </section>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { VenueOption, VENUE_OPTIONS } from "@/state/filter-config-context";
import { VenueGroup } from "@/hooks/use-venue-groups";
import Button from "@/components/button";
import Chip from "@/components/chip";
import ExpandableSection from "@/components/expandable-section";
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
  const venueSearchInputRef = useRef<HTMLInputElement>(null);
  const [venueSearchQuery, setVenueSearchQuery] = useState("");

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

  // Get count for a venue option chip
  const getVenueOptionCount = (option: VenueOption): number | undefined => {
    const counts: Record<VenueOption, number | undefined> = {
      all: allVenueIds.length,
      cinemas: cinemaVenueIds.length,
      small: smallScreeningVenueIds.length,
      nearby: nearbyVenueIds.length > 0 ? nearbyVenueIds.length : undefined,
    };
    return counts[option];
  };

  // Helper to check if a venue is selected
  const isVenueSelected = (venueId: string) => {
    if (selectedVenues === null) return true;
    return selectedVenues.includes(venueId);
  };

  // Determine current venue option
  const currentVenueOption: VenueOption | null = useMemo(() => {
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
    return null;
  }, [selectedVenues, cinemaVenueIds, smallScreeningVenueIds, nearbyVenueIds]);

  return (
    <section className={styles.section} aria-labelledby="venues-heading">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeaderText}>
          <h3 id="venues-heading" className={styles.sectionTitle}>
            Venues
          </h3>
          <p className={styles.sectionDescription}>
            Choose which venues to include
          </p>
        </div>
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
              }
            }}
          />
        ))}
      </div>
      {geoError && <p className={styles.geoError}>{geoError}</p>}
      <ExpandableSection title="Select Specific Venues">
        <div className={styles.advancedFilters}>
          {/* Venue search filter */}
          <div className={styles.venueSearchWrapper}>
            <svg
              className={styles.venueSearchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={venueSearchInputRef}
              type="text"
              className={styles.venueSearchInput}
              placeholder="Filter venues..."
              value={venueSearchQuery}
              onChange={(e) => setVenueSearchQuery(e.target.value)}
            />
            {venueSearchQuery && (
              <button
                type="button"
                className={styles.venueSearchClear}
                onClick={() => {
                  setVenueSearchQuery("");
                  venueSearchInputRef.current?.focus();
                }}
                aria-label="Clear venue filter"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

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
                      >
                        Select All
                      </Button>
                      <span className={styles.controlDivider}>/</span>
                      <Button
                        variant="link"
                        onClick={clearAllInGroup}
                        disabled={noneGroupSelected}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
                <div className={styles.chipGroup} role="group">
                  {group.venues.map((venue) => {
                    // For group-structured venues, remove the group name prefix if present
                    const isGroupStructured = group.id.startsWith("group-");
                    let displayName = venue.name;
                    if (isGroupStructured) {
                      // Remove group label from the start of the name
                      const prefixPattern = new RegExp(
                        `^${group.label}\\s*`,
                        "i",
                      );
                      displayName =
                        venue.name.replace(prefixPattern, "").trim() ||
                        venue.name;
                    }
                    return (
                      <Chip
                        key={venue.id}
                        type="checkbox"
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

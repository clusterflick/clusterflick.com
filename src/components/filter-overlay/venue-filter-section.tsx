"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { VenueOption, VENUE_OPTIONS } from "@/state/filter-config-context";
import { VenueGroup } from "@/hooks/use-venue-groups";
import Button from "@/components/button";
import Chip from "@/components/chip";
import VenueQuickAdd, {
  VenueQuickAddHandle,
} from "@/components/venue-quick-add";
import VenueMapPicker, {
  VenueMapPickerItem,
} from "@/components/venue-map-picker";
import type { Position } from "@/types";
import type { VenueOrigin } from "@/lib/places";
import VenuePlacePicker, {
  type VenuePlacePickerHandle,
} from "./venue-place-picker";
import styles from "./filter-overlay.module.css";

interface VenueFilterSectionProps {
  venueGroups: VenueGroup[];
  allVenueIds: string[];
  cinemaVenueIds: string[];
  smallScreeningVenueIds: string[];
  /**
   * The reader's "My Venues" that are in the dataset. Empty when signed out or
   * when they have none, which hides the pill.
   */
  favouriteVenueIds: string[];
  selectedVenues: string[] | null;
  geoLoading: boolean;
  geoError: string | null;
  /** Explanation for a "near me" lookup that succeeded but matched no venues. */
  nearbyNotice: string | null;
  /** The place the selection was picked from, while it still is. */
  venueOrigin: VenueOrigin | null;
  onPickNearPlace: (origin: VenueOrigin) => void;
  onRequestLocation: () => Promise<Position | null>;
  onVenueOptionChange: (option: VenueOption, venueIds: string[]) => void;
  toggleVenue: (venueId: string, allVenueIds: string[]) => void;
  selectVenues: (venueIds: string[]) => void;
  clearVenues: () => void;
}

export default function VenueFilterSection({
  venueGroups,
  allVenueIds,
  cinemaVenueIds,
  smallScreeningVenueIds,
  favouriteVenueIds,
  selectedVenues,
  geoLoading,
  geoError,
  nearbyNotice,
  venueOrigin,
  onPickNearPlace,
  onRequestLocation,
  onVenueOptionChange,
  toggleVenue,
  selectVenues,
  clearVenues,
}: VenueFilterSectionProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const quickAddRef = useRef<VenueQuickAddHandle>(null);
  const pickerRef = useRef<VenuePlacePickerHandle>(null);
  // Near Me or Near a Station… tapped but nothing picked from it yet — the
  // reader's position is still being found, or couldn't be, or no station has
  // been chosen — so that pill shows as chosen and the settings they share
  // open, while the selection stays as it was.
  const [pendingNear, setPendingNear] = useState<NearOption | null>(null);
  // Any other change to the selection (a venue toggled by hand, a preset)
  // means the reader has moved on from the place. Adjusted during render
  // rather than in an effect, so the pill never shows a stale choice.
  const [lastSelection, setLastSelection] = useState(selectedVenues);
  if (lastSelection !== selectedVenues) {
    setLastSelection(selectedVenues);
    if (pendingNear) setPendingNear(null);
  }

  // Focus the quick-add input on the next frame. Deferring past the current
  // click lets the tapped radio settle first, so focus reliably lands on the
  // input rather than being reclaimed by the pill.
  const focusQuickAdd = () => {
    requestAnimationFrame(() => quickAddRef.current?.focus());
  };

  // Flat list of every venue (full names) for the quick-add combobox. Names
  // are kept intact so near-duplicates stay distinguishable in a flat
  // suggestion list.
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

  // What a place can pick from: every venue with something showing, as the
  // other pills count.
  const placeVenues = useMemo(
    () => venueGroups.flatMap((group) => group.venues),
    [venueGroups],
  );

  const mapVenues = useMemo<VenueMapPickerItem[]>(
    () =>
      venueGroups.flatMap((group) =>
        group.venues.map((venue) => ({
          id: venue.id,
          name: venue.name,
          lat: venue.geo.lat,
          lon: venue.geo.lon,
          filmCount: venue.count,
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
      nearby:
        venueOrigin?.place === "here" ? venueOrigin.venues.length : undefined,
      place:
        venueOrigin && venueOrigin.place !== "here"
          ? venueOrigin.venues.length
          : undefined,
      favourites: favouriteVenueIds.length,
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
    // A near pill just tapped, then the place the selection was picked from:
    // what the reader asked for, even if its venues happen to equal a preset.
    // The checked pill follows the origin, so picking King's Cross checks
    // Near a Station… and Use my location moves it back to Near Me.
    if (pendingNear) return pendingNear;
    if (venueOrigin) return venueOrigin.place === "here" ? "nearby" : "place";
    // All venues selected (null means no filter = all)
    if (selectedVenues === null) return "all";
    // The reader's own set first: if it happens to equal a preset, it's still
    // the one they picked.
    if (matchesExactly(selectedVenues, favouriteVenueIds)) return "favourites";
    if (matchesExactly(selectedVenues, cinemaVenueIds)) return "cinemas";
    if (matchesExactly(selectedVenues, smallScreeningVenueIds)) return "small";
    return "custom";
  }, [
    selectedVenues,
    favouriteVenueIds,
    cinemaVenueIds,
    smallScreeningVenueIds,
    venueOrigin,
    pendingNear,
  ]);

  const venueOptions = VENUE_OPTIONS.filter(
    ({ value }) => value !== "favourites" || favouriteVenueIds.length > 0,
  );

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
        Choose which venues to include: near you or a station, by name, or by
        area on a map.
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
        {venueOptions.map(({ value, label }) => (
          <Chip
            key={value}
            type="radio"
            name="venue-option"
            label={label}
            value={value}
            count={getVenueOptionCount(value)}
            checked={currentVenueOption === value}
            onChange={(v) => {
              const option = v as VenueOption;
              setPendingNear(isNearOption(option) ? option : null);
              if (option === "nearby") {
                // One tap is near you on Auto: the settings open below and
                // locate the reader once mounted. Without a position they
                // focus the station search instead.
                requestAnimationFrame(() => pickerRef.current?.locate("auto"));
              } else if (option === "place") {
                // The ellipsis says it: this one needs a station first. It
                // never asks for the reader's location.
                requestAnimationFrame(() => pickerRef.current?.focusSearch());
              } else if (option === "all") {
                clearVenues();
              } else if (option === "cinemas") {
                onVenueOptionChange(option, cinemaVenueIds);
              } else if (option === "small") {
                onVenueOptionChange(option, smallScreeningVenueIds);
              } else if (option === "favourites") {
                onVenueOptionChange(option, favouriteVenueIds);
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
      {isNearOption(currentVenueOption) && (
        <VenuePlacePicker
          origin={venueOrigin}
          venues={placeVenues}
          geoLoading={geoLoading}
          geoError={geoError}
          onPick={(origin) => {
            setPendingNear(null);
            onPickNearPlace(origin);
          }}
          onRequestLocation={onRequestLocation}
          ref={pickerRef}
        />
      )}
      {!isNearOption(currentVenueOption) && geoError && (
        <p className={styles.geoError} role="alert">
          {geoError}
        </p>
      )}
      {nearbyNotice && (
        <p className={styles.geoNotice} role="status">
          {nearbyNotice}
        </p>
      )}
      <VenueQuickAdd
        className={styles.standaloneQuickAdd}
        ref={quickAddRef}
        venues={allVenues}
        isVenueSelected={isVenueSelected}
        onToggleVenue={(venueId) => toggleVenue(venueId, allVenueIds)}
      />
      <Button
        variant="secondary"
        className={styles.venueMapButton}
        onClick={() => setMapOpen(true)}
      >
        Choose on a map
      </Button>
      {mapOpen && (
        <VenueMapPicker
          venues={mapVenues}
          selectedVenues={selectedVenues}
          onApply={(venueIds) => {
            if (venueIds === null) clearVenues();
            else selectVenues(venueIds);
            setMapOpen(false);
          }}
          onClose={() => setMapOpen(false)}
        />
      )}
    </section>
  );
}

/** The two pills that share the place settings. */
type NearOption = Extract<VenueOption, "nearby" | "place">;

function isNearOption(option: VenueOption): option is NearOption {
  return option === "nearby" || option === "place";
}

/** Whether a selection is exactly a (non-empty) preset's venues. */
function matchesExactly(selected: string[], preset: string[]): boolean {
  return (
    preset.length > 0 &&
    selected.length === preset.length &&
    selected.every((id) => preset.includes(id))
  );
}

"use client";

import { useState } from "react";
import { MovieOption } from "@/lib/filters";
import Button from "@/components/button";
import Chip from "@/components/chip";
import EntityQuickAdd from "@/components/entity-quick-add";
import styles from "./filter-overlay.module.css";

/**
 * Past this many chips the selection collapses to a count. A watchlist can
 * hold dozens of films, and a wall of chips would push every other filter in
 * the section off the screen.
 */
const MAX_VISIBLE_CHIPS = 6;

interface MovieFilterSectionProps {
  /** Every selectable film, most performances first. */
  vocabulary: MovieOption[];
  /** Current selection; `null` or empty means no filter. */
  selected: string[] | null;
  /**
   * Every film on the reader's watchlist, showing or not. Empty while signed
   * out or before the lists load, which hides the watchlist chip.
   */
  watchlistIds: string[];
  toggleMovie: (movieId: string) => void;
  selectMovies: (movieIds: string[]) => void;
  clearMovies: () => void;
}

/**
 * The films filter — a typeahead over what is screening, with the selection
 * drawn as chips. Mostly filled from a watchlist link on /personalise, so it
 * has to cope with a selection far longer than anyone would type in.
 *
 * Only ids the dataset resolves are drawn or counted. The rest stay in the
 * filter state, since a film off today can be back tomorrow, and are
 * acknowledged in one line so a selection of nothing-showing doesn't read as
 * an empty filter.
 *
 * A signed-in reader gets a "My Watchlist" chip above the search, which
 * selects the whole list as "Explore watchlist" on /personalise does — but
 * from here, so it combines with whatever else is set (My Venues, say)
 * without a round trip. It reads as checked while the selection is exactly
 * the watchlist.
 */
export default function MovieFilterSection({
  vocabulary,
  selected,
  watchlistIds,
  toggleMovie,
  selectMovies,
  clearMovies,
}: MovieFilterSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const chosen = selected ?? [];
  const chosenSet = new Set(chosen);
  const chosenOptions = vocabulary.filter((option) => chosenSet.has(option.id));
  const notShowing = chosenSet.size - chosenOptions.length;
  const collapsed = !showAll && chosenOptions.length > MAX_VISIBLE_CHIPS;
  const watchlistSelected =
    watchlistIds.length > 0 &&
    chosenSet.size === watchlistIds.length &&
    watchlistIds.every((id) => chosenSet.has(id));
  // The count is what the reader gets: the films on the list that are showing.
  const watchlistSet = new Set(watchlistIds);
  const watchlistShowing = vocabulary.filter((option) =>
    watchlistSet.has(option.id),
  ).length;

  if (vocabulary.length === 0) return null;

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.advancedFilterHeader}>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={clearMovies}
            disabled={chosen.length === 0}
            aria-label="Clear all films"
          >
            Clear All
          </Button>
        </div>
      </div>

      {chosenOptions.length > 0 && (
        <>
          {collapsed ? (
            <p className={styles.selectionNote}>
              {chosenOptions.length} films selected.{" "}
              <Button variant="link" onClick={() => setShowAll(true)}>
                Show them
              </Button>
            </p>
          ) : (
            <div
              className={styles.chipGroup}
              role="group"
              aria-label="Selected films"
            >
              {chosenOptions.map((option) => (
                <Chip
                  key={option.id}
                  type="checkbox"
                  name="movies"
                  label={option.name}
                  count={option.count}
                  checked
                  onChange={() => toggleMovie(option.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {notShowing > 0 && (
        <p className={styles.selectionNote}>
          {chosenOptions.length > 0 ? "Plus " : ""}
          {notShowing} {notShowing === 1 ? "film" : "films"} not currently
          showing.
        </p>
      )}

      {watchlistIds.length > 0 && (
        <div
          className={styles.chipGroup}
          role="group"
          aria-label="Film quick filters"
        >
          <Chip
            type="checkbox"
            name="movies-watchlist"
            label="My Watchlist"
            count={watchlistShowing}
            checked={watchlistSelected}
            onChange={(checked) =>
              checked ? selectMovies(watchlistIds) : clearMovies()
            }
          />
        </div>
      )}

      <EntityQuickAdd
        items={vocabulary}
        isSelected={(id) => chosenSet.has(id)}
        onToggle={toggleMovie}
        inputId="movies-quick-add-input"
        placeholder="Search for a film…"
        ariaLabel="Search for a film"
      />
    </div>
  );
}

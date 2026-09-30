"use client";

import { useMemo } from "react";
import {
  matchAny,
  PROGRAMME_GROUPS,
  getProgrammeName,
  MoviesRecord,
  ProgrammeFilterId,
  ProgrammeGroupConfig,
} from "@/lib/filters";
import Button from "@/components/button";
import Chip from "@/components/chip";
import EntityQuickAdd, {
  EntityQuickAddItem,
} from "@/components/entity-quick-add";
import styles from "./filter-overlay.module.css";

/**
 * Every club or festival in a group, by name. No counts: counting one means
 * running its matchers over the dataset, a few milliseconds each, and ~90 of
 * them on opening the overlay measured over a second. The chips count only
 * what is selected.
 */
const VOCABULARY = new Map<ProgrammeFilterId, EntityQuickAddItem[]>(
  PROGRAMME_GROUPS.map((group) => [
    group.filterId,
    group.programmes
      .map((programme) => ({
        id: programme.id,
        name: getProgrammeName(programme),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ]),
);

interface ProgrammeFilterSectionProps {
  movies: MoviesRecord;
  /** Current selection per group; `null` or empty means no filter. */
  selected: Record<ProgrammeFilterId, string[] | null>;
  toggleProgramme: (filterId: ProgrammeFilterId, programmeId: string) => void;
  clearProgrammes: (filterId: ProgrammeFilterId) => void;
}

/**
 * Film club and festival filters — a typeahead over the registry, with the
 * selection drawn as chips counting the films each has showing. Mostly filled
 * from a club or festival page's links, so its main job is to show that the
 * filter is there and let it be taken off.
 *
 * Ids the registry no longer holds are acknowledged in one line rather than
 * drawn, as the films filter does for films that have finished their run.
 */
export default function ProgrammeFilterSection({
  movies,
  selected,
  toggleProgramme,
  clearProgrammes,
}: ProgrammeFilterSectionProps) {
  return (
    <>
      {PROGRAMME_GROUPS.map((group) => (
        <ProgrammeGroup
          key={group.filterId}
          group={group}
          movies={movies}
          selected={selected[group.filterId]}
          toggleProgramme={toggleProgramme}
          clearProgrammes={clearProgrammes}
        />
      ))}
    </>
  );
}

function ProgrammeGroup({
  group,
  movies,
  selected,
  toggleProgramme,
  clearProgrammes,
}: {
  group: ProgrammeGroupConfig;
  movies: MoviesRecord;
  selected: string[] | null;
  toggleProgramme: (filterId: ProgrammeFilterId, programmeId: string) => void;
  clearProgrammes: (filterId: ProgrammeFilterId) => void;
}) {
  const chosen = useMemo(() => selected ?? [], [selected]);
  const chosenSet = new Set(chosen);

  // Counted over the whole dataset, as the other chips are, and memoised by
  // the matcher cache the filter itself has already filled.
  const chosenOptions = useMemo(
    () =>
      chosen.flatMap((id) => {
        const programme = group.programmes.find((p) => p.id === id);
        if (!programme) return [];
        return [
          {
            id,
            name: getProgrammeName(programme),
            count: Object.keys(matchAny(programme.matchers, movies)).length,
          },
        ];
      }),
    [chosen, group, movies],
  );
  const notListed = chosen.length - chosenOptions.length;

  return (
    <div className={styles.advancedFilterGroup}>
      <div className={styles.advancedFilterHeader}>
        <h4 className={styles.advancedFilterTitle}>{group.title}</h4>
        <div className={styles.selectionControls}>
          <Button
            variant="link"
            onClick={() => clearProgrammes(group.filterId)}
            disabled={chosen.length === 0}
            aria-label={`Clear all ${group.plural}`}
          >
            Clear All
          </Button>
        </div>
      </div>

      {chosenOptions.length > 0 && (
        <div
          className={styles.chipGroup}
          role="group"
          aria-label={`Selected ${group.plural}`}
        >
          {chosenOptions.map((option) => (
            <Chip
              key={option.id}
              type="checkbox"
              name={group.filterId}
              label={option.name}
              count={option.count}
              checked
              onChange={() => toggleProgramme(group.filterId, option.id)}
            />
          ))}
        </div>
      )}

      {notListed > 0 && (
        <p className={styles.selectionNote}>
          {chosenOptions.length > 0 ? "Plus " : ""}
          {notListed} {notListed === 1 ? group.singular : group.plural} no
          longer listed.
        </p>
      )}

      <EntityQuickAdd
        items={VOCABULARY.get(group.filterId)!}
        isSelected={(id) => chosenSet.has(id)}
        onToggle={(id) => toggleProgramme(group.filterId, id)}
        inputId={`${group.filterId}-quick-add-input`}
        placeholder={`Search for a ${group.singular}…`}
        ariaLabel={`Search for a ${group.singular}`}
      />
    </div>
  );
}

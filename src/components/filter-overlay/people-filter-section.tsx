"use client";

import { PEOPLE_GROUPS, PeopleFilterId, PersonOption } from "@/lib/filters";
import Button from "@/components/button";
import Chip from "@/components/chip";
import EntityQuickAdd from "@/components/entity-quick-add";
import styles from "./filter-overlay.module.css";

interface PeopleFilterSectionProps {
  /** Every selectable person per group, best-represented first. */
  vocabulary: Record<PeopleFilterId, PersonOption[]>;
  /** Current selection per group; `null` or empty means no filter. */
  selected: Record<PeopleFilterId, string[] | null>;
  togglePerson: (filterId: PeopleFilterId, personId: string) => void;
  clearPeople: (filterId: PeopleFilterId) => void;
}

/**
 * Director and cast filters.
 *
 * A typeahead rather than a chip list, which is the whole reason this section
 * looks different from Events: the vocabulary is ~1,300 directors and ~11,000
 * cast, derived from what is actually screening, so there is nothing to
 * enumerate and no "Select All" that would mean anything. Only the current
 * selection is drawn as chips, which doubles as the way to remove one.
 *
 * The counts beside each suggestion are films currently in the dataset, not a
 * filmography — this is a filter over what is on, not a record of a career.
 */
export default function PeopleFilterSection({
  vocabulary,
  selected,
  togglePerson,
  clearPeople,
}: PeopleFilterSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="people-heading">
      <div className={styles.sectionHeader}>
        <h3 id="people-heading" className={styles.sectionTitle}>
          Cast &amp; Crew
        </h3>
      </div>
      <p className={styles.sectionDescription}>
        Find films by the people who made them
      </p>

      {PEOPLE_GROUPS.map((group) => {
        const options = vocabulary[group.filterId] ?? [];
        const chosen = selected[group.filterId] ?? [];
        const chosenSet = new Set(chosen);
        // The chips are drawn from the vocabulary so they carry a name and a
        // count. A selected id the current dataset no longer knows about — a
        // shared link whose films have all come off — would otherwise render as
        // a nameless chip that cannot be explained, so it is left out of the
        // chips while staying in the filter state.
        const chosenOptions = options.filter((option) =>
          chosenSet.has(option.id),
        );

        if (options.length === 0) return null;

        return (
          <div key={group.filterId} className={styles.advancedFilterGroup}>
            <div className={styles.sectionHeader}>
              <h4 className={styles.sectionSubTitle}>{group.title}</h4>
              <div className={styles.selectionControls}>
                <Button
                  variant="link"
                  onClick={() => clearPeople(group.filterId)}
                  disabled={chosen.length === 0}
                  aria-label={`Clear all ${group.title.toLowerCase()}`}
                >
                  Clear All
                </Button>
              </div>
            </div>

            {chosenOptions.length > 0 && (
              <div
                className={styles.chipGroup}
                role="group"
                aria-label={`Selected ${group.title.toLowerCase()}`}
              >
                {chosenOptions.map((option) => (
                  <Chip
                    key={option.id}
                    type="checkbox"
                    name={group.filterId}
                    label={option.name}
                    count={option.count}
                    checked
                    onChange={() => togglePerson(group.filterId, option.id)}
                  />
                ))}
              </div>
            )}

            <EntityQuickAdd
              items={options}
              isSelected={(id) => chosenSet.has(id)}
              onToggle={(id) => togglePerson(group.filterId, id)}
              inputId={`${group.filterId}-quick-add-input`}
              placeholder={`Search for a ${group.singular}…`}
              ariaLabel={`Search for a ${group.singular}`}
            />
          </div>
        );
      })}
    </section>
  );
}

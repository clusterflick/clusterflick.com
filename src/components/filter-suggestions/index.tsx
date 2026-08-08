"use client";

import clsx from "clsx";
import type { FilterSuggestion, SuggestionKind } from "@/lib/filters";
import styles from "./filter-suggestions.module.css";

/**
 * Offers that keep the reader's words intact are tinted apart from the ones
 * that give a filter up, so the difference is visible before the label is read.
 */
const KIND_CLASSES: Record<SuggestionKind, string | undefined> = {
  redirect: styles.redirect,
  correct: styles.correct,
  widen: undefined,
};

interface FilterSuggestionsProps {
  /** Ranked offers, cheapest-first, as returned by `suggestFilterRelaxations`. */
  suggestions: FilterSuggestion[];
  /** Called with the full filter state the chosen offer produces. */
  onApply: (suggestion: FilterSuggestion) => void;
  className?: string;
}

/**
 * The list of "here's what would work" offers shown when a filtered view
 * returns nothing. Each row states the change and the number of results it
 * yields, so the reader can weigh them rather than guessing.
 */
export default function FilterSuggestions({
  suggestions,
  onApply,
  className,
}: FilterSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul className={clsx(styles.list, className)}>
      {suggestions.map((suggestion) => (
        <li key={suggestion.id}>
          <button
            type="button"
            className={clsx(styles.offer, KIND_CLASSES[suggestion.kind])}
            onClick={() => onApply(suggestion)}
          >
            <span className={styles.text}>
              <span className={styles.headline}>{suggestion.headline}</span>
              {/* One line per filter touched, rather than a run-on phrase —
                  "Did you mean “X”?, any date" put a comma after a question
                  mark and buried the second change at the end of the first. */}
              {suggestion.changes.map((change) => (
                <span key={change.label} className={styles.change}>
                  {change.label}
                  {change.detail && (
                    <span className={styles.changeDetail}>
                      : {change.detail}
                    </span>
                  )}
                </span>
              ))}
            </span>
            <span className={styles.count}>
              {suggestion.count.toLocaleString("en-GB")} result
              {suggestion.count === 1 ? "" : "s"}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

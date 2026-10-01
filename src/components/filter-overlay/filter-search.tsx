"use client";

import { useEffect, useMemo } from "react";
import { useCombobox } from "downshift";
import clsx from "clsx";
import {
  FilterSearchEntry,
  FilterState,
  isFilterSearchEntrySelected,
  prepareFilterSearch,
  searchFilterGroups,
} from "@/lib/filters";
import SearchInput from "@/components/search-input";
import styles from "./filter-overlay.module.css";

/** The other text fields a query can be moved to. */
export type SearchRedirect = "showingTitleSearch" | "performanceNotesSearch";

const REDIRECTS: { field: SearchRedirect; label: string }[] = [
  { field: "performanceNotesSearch", label: "performance notes" },
  { field: "showingTitleSearch", label: "original venue titles" },
];

type MenuItem =
  | { type: "entry"; entry: FilterSearchEntry }
  | { type: "redirect"; field: SearchRedirect; label: string };

interface FilterSearchProps {
  /** Whether the overlay is open; the index is built once it is. */
  active: boolean;
  /** The title query: the box searches titles as it's typed, as it always has. */
  query: string;
  onQueryChange: (query: string) => void;
  /** From `buildFilterSearchGroups`, memoised on the dataset. */
  groups: FilterSearchEntry[][];
  /** For ticking what's already selected. */
  filterState: FilterState;
  onPick: (entry: FilterSearchEntry) => void;
  onRedirect: (field: SearchRedirect) => void;
}

/**
 * The overlay's search box. Typing still searches titles live; the menu
 * underneath also offers every filter value the query names — a director, a
 * venue, a genre, a format, an accessibility feature — and the two other text
 * fields to search instead. It is what makes a filter findable without
 * knowing it exists, or where it lives.
 *
 * Nothing is highlighted until the reader arrows down, so Enter and typing
 * mean what they always did, and a menu the reader ignores costs nothing.
 */
export default function FilterSearch({
  active,
  query,
  onQueryChange,
  groups,
  filterState,
  onPick,
  onRedirect,
}: FilterSearchProps) {
  // Built while the reader is looking at the overlay rather than on their
  // first keystroke, and only for readers who open it.
  useEffect(() => {
    if (!active) return;
    const build = () => prepareFilterSearch(groups);
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(build, { timeout: 2000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = setTimeout(build, 200);
    return () => clearTimeout(handle);
  }, [active, groups]);

  const items = useMemo<MenuItem[]>(() => {
    const entries = searchFilterGroups(groups, query);
    if (entries.length === 0 && query.trim().length === 0) return [];
    return [
      ...entries.map((entry) => ({ type: "entry" as const, entry })),
      ...(query.trim().length > 0
        ? REDIRECTS.map(({ field, label }) => ({
            type: "redirect" as const,
            field,
            label,
          }))
        : []),
    ];
  }, [groups, query]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox<MenuItem>({
    items,
    inputValue: query,
    inputId: "filter-search",
    selectedItem: null,
    itemToString: () => "",
    onInputValueChange: ({ inputValue }) => onQueryChange(inputValue ?? ""),
    onStateChange: ({ type, selectedItem }) => {
      if (
        selectedItem &&
        (type === useCombobox.stateChangeTypes.InputKeyDownEnter ||
          type === useCombobox.stateChangeTypes.ItemClick)
      ) {
        if (selectedItem.type === "entry") onPick(selectedItem.entry);
        else onRedirect(selectedItem.field);
      }
    },
    stateReducer: (state, { type, changes }) => {
      switch (type) {
        // A pick clears the box itself (the query was the value's name, or
        // has moved to another field), so the menu closes on an empty box.
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return { ...changes, inputValue: "", isOpen: false };
        // Downshift picks the highlighted item on blur and clears the box on
        // Escape. This box is also the title search: leaving it, or closing
        // the overlay with Escape, must not change what it says.
        case useCombobox.stateChangeTypes.InputBlur:
        case useCombobox.stateChangeTypes.InputKeyDownEscape:
          return {
            ...changes,
            inputValue: state.inputValue,
            selectedItem: state.selectedItem,
          };
        default:
          return changes;
      }
    },
  });

  const { ref: downshiftRef, ...inputProps } = getInputProps();
  const showMenu = isOpen && items.length > 0;
  const firstRedirect = items.findIndex((item) => item.type === "redirect");

  return (
    <div className={styles.filterSearch}>
      <label {...getLabelProps()} className={styles.visuallyHidden}>
        Search titles, or find a filter
      </label>
      <SearchInput
        id="filter-search"
        value={query}
        onChange={onQueryChange}
        placeholder="Search titles, people, venues, formats…"
        ariaLabel="Search titles, or find a filter"
        inputRef={(node) => {
          if (typeof downshiftRef === "function") downshiftRef(node);
        }}
        inputProps={inputProps}
      />
      <ul
        {...getMenuProps()}
        className={clsx(styles.searchMenu, showMenu && styles.searchMenuOpen)}
      >
        {showMenu &&
          items.map((item, index) => {
            const highlighted = highlightedIndex === index;
            if (item.type === "redirect") {
              return (
                <li
                  key={item.field}
                  className={clsx(
                    styles.searchMenuItem,
                    index === firstRedirect &&
                      firstRedirect > 0 &&
                      styles.searchMenuDivider,
                    highlighted && styles.searchMenuHighlighted,
                  )}
                  {...getItemProps({ item, index })}
                >
                  <span className={styles.searchMenuName}>
                    Search {item.label} for &ldquo;{query.trim()}&rdquo;
                  </span>
                </li>
              );
            }
            const { entry } = item;
            const selected = isFilterSearchEntrySelected(filterState, entry);
            return (
              <li
                key={entry.key}
                className={clsx(
                  styles.searchMenuItem,
                  highlighted && styles.searchMenuHighlighted,
                  selected && styles.searchMenuSelected,
                )}
                {...getItemProps({ item, index })}
              >
                <span className={styles.searchMenuName}>{entry.name}</span>
                <span className={styles.searchMenuKind}>{entry.kind}</span>
                {entry.count !== undefined && (
                  <span className={styles.searchMenuCount}>{entry.count}</span>
                )}
                <span className={styles.visuallyHidden}>
                  {selected
                    ? " (selected, activate to remove)"
                    : " (activate to filter by)"}
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

"use client";

import { Ref, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useCombobox } from "downshift";
import clsx from "clsx";
import SearchInput from "@/components/search-input";
import styles from "./venue-quick-add.module.css";

export interface VenueQuickAddItem {
  id: string;
  /** Full, unabbreviated venue name — shown as-is so near-duplicates (e.g.
   * multiple Cineworlds) stay distinguishable in the flat suggestion list. */
  name: string;
  count: number;
}

/** Imperative handle for parents to focus the search input (e.g. from the
 * "Custom" venue pill). */
export interface VenueQuickAddHandle {
  focus: () => void;
}

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
 * filter without scrolling the grouped list. Type to search, then pick a
 * suggestion to flip its inclusion; suggestions show whether the venue is
 * already selected. Selecting closes the menu and clears the query, ready for
 * the next search.
 *
 * Built on Downshift's `useCombobox` for the ARIA/keyboard behaviour; it owns
 * no selection state of its own, delegating to `isVenueSelected`/`onToggleVenue`
 * so it stays in lockstep with the grouped venue chips.
 */
export default function VenueQuickAdd({
  venues,
  isVenueSelected,
  onToggleVenue,
  maxResults = 8,
  ref,
}: VenueQuickAddProps) {
  const [inputValue, setInputValue] = useState("");
  const localInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(
    ref,
    () => ({ focus: () => localInputRef.current?.focus() }),
    [],
  );

  const items = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    if (!query) return [];
    return venues
      .filter((venue) => venue.name.toLowerCase().includes(query))
      .slice(0, maxResults);
  }, [venues, inputValue, maxResults]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox<VenueQuickAddItem>({
    items,
    inputValue,
    // Keep selection empty so the same venue can be toggled repeatedly and no
    // "selected" value is ever written back into the input.
    selectedItem: null,
    itemToString: (item) => item?.name ?? "",
    onInputValueChange: ({ inputValue: value }) => setInputValue(value ?? ""),
    onStateChange: ({ type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (selectedItem) onToggleVenue(selectedItem.id);
          break;
        default:
          break;
      }
    },
    stateReducer: (state, { type, changes }) => {
      switch (type) {
        // On pick: toggle happens in onStateChange; here we reset the field and
        // close the menu so it's ready for the next search (close-on-pick).
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            inputValue: "",
            isOpen: false,
            highlightedIndex: -1,
          };
        default:
          return changes;
      }
    },
  });

  // Downshift bundles its input ref into getInputProps(); merge it with our own
  // local ref (used for the imperative `focus()` handle) and hand the combined
  // callback to SearchInput separately from the rest of the props.
  const { ref: downshiftRef, ...inputProps } = getInputProps();
  const setInputRef = (node: HTMLInputElement | null) => {
    localInputRef.current = node;
    // Downshift always hands back a callback ref (built via its internal
    // `handleRefs`), so only the function case ever occurs at runtime.
    if (typeof downshiftRef === "function") {
      downshiftRef(node);
    }
  };
  const showMenu = isOpen && items.length > 0;

  return (
    <div className={styles.quickAdd}>
      <label {...getLabelProps()} className={styles.visuallyHidden}>
        Quick toggle a venue
      </label>
      <div className={styles.control}>
        <SearchInput
          id="venue-quick-add-input"
          value={inputValue}
          onChange={setInputValue}
          placeholder="Quick toggle a venue…"
          ariaLabel="Quick toggle a venue"
          inputRef={setInputRef}
          inputProps={inputProps}
        />
        <ul
          {...getMenuProps()}
          className={clsx(styles.menu, showMenu && styles.menuOpen)}
        >
          {showMenu &&
            items.map((item, index) => {
              const selected = isVenueSelected(item.id);
              return (
                <li
                  key={item.id}
                  className={clsx(
                    styles.item,
                    highlightedIndex === index && styles.highlighted,
                    selected && styles.itemSelected,
                  )}
                  {...getItemProps({ item, index })}
                >
                  <span className={styles.check} aria-hidden="true">
                    {selected && (
                      <svg
                        width="12"
                        height="10"
                        viewBox="0 0 12 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemCount}>{item.count}</span>
                  <span className={styles.visuallyHidden}>
                    {selected
                      ? " (selected, activate to remove)"
                      : " (activate to add)"}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

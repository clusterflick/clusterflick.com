"use client";

import { Ref, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useCombobox } from "downshift";
import clsx from "clsx";
import SearchInput from "@/components/search-input";
import styles from "./entity-quick-add.module.css";

export interface EntityQuickAddItem {
  id: string;
  /** Full, unabbreviated name, so near-duplicates stay distinguishable. */
  name: string;
  count: number;
}

/** Imperative handle for parents to focus the search input. */
export interface EntityQuickAddHandle {
  focus: () => void;
}

interface EntityQuickAddProps {
  /** Flat list of everything selectable, with full names. */
  items: EntityQuickAddItem[];
  /** Whether an item is currently included in the filter. */
  isSelected: (id: string) => boolean;
  /** Toggle an item's inclusion. Called on pick, then the input clears. */
  onToggle: (id: string) => void;
  /** Unique DOM id for the input, since several of these can share a page. */
  inputId: string;
  /** Placeholder and accessible label, e.g. "Quick toggle a venue…". */
  placeholder: string;
  /** Accessible label, without the ellipsis. */
  ariaLabel: string;
  /** Max suggestions shown at once. */
  maxResults?: number;
  /** Optional handle exposing `focus()` for the underlying search input. */
  ref?: Ref<EntityQuickAddHandle>;
}

/**
 * A search-and-toggle combobox for adding or removing one named thing from a
 * filter. Type to search, then pick a suggestion to flip its inclusion;
 * suggestions show whether it is already selected. Selecting closes the menu
 * and clears the query, ready for the next search.
 *
 * Built on Downshift's `useCombobox` for the ARIA/keyboard behaviour; it owns
 * no selection state of its own, delegating to `isSelected`/`onToggle` so it
 * stays in lockstep with whatever renders the current selection.
 *
 * Matching is a plain case-insensitive substring, never fuzzy: the reader is
 * typing a name they already have in mind.
 */
export default function EntityQuickAdd({
  items: allItems,
  isSelected,
  onToggle,
  inputId,
  placeholder,
  ariaLabel,
  maxResults = 8,
  ref,
}: EntityQuickAddProps) {
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
    // `allItems` arrives best-represented first, so stopping early keeps the
    // most-screened matches and avoids walking 11,000 cast names.
    const matches: EntityQuickAddItem[] = [];
    for (const item of allItems) {
      if (!item.name.toLowerCase().includes(query)) continue;
      matches.push(item);
      if (matches.length >= maxResults) break;
    }
    return matches;
  }, [allItems, inputValue, maxResults]);

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox<EntityQuickAddItem>({
    items,
    inputValue,
    // Must go to the hook, not the input: `getInputProps()` spreads Downshift's
    // own generated id over anything passed alongside, and `getLabelProps()`
    // builds its `htmlFor` from it.
    inputId,
    // Keep selection empty so the same item can be toggled repeatedly and no
    // "selected" value is ever written back into the input.
    selectedItem: null,
    itemToString: (item) => item?.name ?? "",
    onInputValueChange: ({ inputValue: value }) => setInputValue(value ?? ""),
    onStateChange: ({ type, selectedItem }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          if (selectedItem) onToggle(selectedItem.id);
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
        {ariaLabel}
      </label>
      <div className={styles.control}>
        <SearchInput
          id={inputId}
          value={inputValue}
          onChange={setInputValue}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
          inputRef={setInputRef}
          inputProps={inputProps}
        />
        <ul
          {...getMenuProps()}
          className={clsx(styles.menu, showMenu && styles.menuOpen)}
        >
          {showMenu &&
            items.map((item, index) => {
              const selected = isSelected(item.id);
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

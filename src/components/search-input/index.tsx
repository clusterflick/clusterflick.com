"use client";

import { ComponentPropsWithoutRef, ReactNode, Ref, useRef } from "react";
import clsx from "clsx";
import styles from "./search-input.module.css";

interface SearchInputProps {
  /** Unique id for the underlying `<input>` (also used to associate labels). */
  id: string;
  /** Current search value (controlled). */
  value: string;
  /** Called with the new value on every change. */
  onChange: (value: string) => void;
  /** Placeholder text shown when empty. */
  placeholder: string;
  /** Accessible label for the input and its clear button. */
  ariaLabel: string;
  /** Optional class applied to the wrapper for layout overrides. */
  className?: string;
  /**
   * Optional content rendered inside the pill at the far right (e.g. a "More
   * Filters" button). The clear button automatically sits to its left.
   */
  trailing?: ReactNode;
  /**
   * Optional external ref to the underlying `<input>`. Merged with the
   * internal ref (used for clear-to-refocus), so both are honoured. Useful for
   * headless controllers like Downshift that need their own ref.
   */
  inputRef?: Ref<HTMLInputElement>;
  /**
   * Props spread onto the `<input>` last, so they override the defaults set by
   * this component (e.g. the result of Downshift's `getInputProps()`, with its
   * `ref` passed separately via `inputRef`).
   */
  inputProps?: ComponentPropsWithoutRef<"input">;
}

const SearchIcon = () => (
  <svg
    className={styles.icon}
    width="20"
    height="20"
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
);

const ClearIcon = () => (
  <svg
    width="16"
    height="16"
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
);

/**
 * A rounded text input with a leading magnifying-glass icon and a trailing
 * clear button that appears once the field has a value. Controlled via
 * `value`/`onChange`. Clearing refocuses the input. An optional `trailing` slot
 * renders extra controls inside the pill, to the right of the clear button.
 */
export default function SearchInput({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  trailing,
  inputRef: externalRef,
  inputProps,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Merge the internal ref (used for clear-to-refocus) with an optional
  // external ref, so a headless controller can attach its own without
  // clobbering ours. Writing `.current` on the passed ref object is the
  // standard mergeRefs pattern — the ref is an intentional sink, not shared
  // state, so the immutability lint doesn't apply.
  const setInputRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof externalRef === "function") {
      externalRef(node);
    } else if (externalRef) {
      // eslint-disable-next-line react-hooks/immutability
      externalRef.current = node;
    }
  };

  return (
    <div
      className={clsx(
        styles.wrapper,
        trailing && styles.hasTrailing,
        className,
      )}
    >
      <SearchIcon />
      <input
        ref={setInputRef}
        type="text"
        id={id}
        className={styles.input}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
      />
      {(value || trailing) && (
        <div className={styles.controls}>
          {value && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              aria-label={`Clear ${ariaLabel.toLowerCase()}`}
            >
              <ClearIcon />
            </button>
          )}
          {trailing}
        </div>
      )}
    </div>
  );
}

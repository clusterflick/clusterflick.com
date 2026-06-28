"use client";

import { ReactNode, useRef } from "react";
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
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        ref={inputRef}
        type="text"
        id={id}
        className={styles.input}
        placeholder={placeholder}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

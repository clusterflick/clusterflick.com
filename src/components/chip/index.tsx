"use client";

import clsx from "clsx";
import styles from "./chip.module.css";

interface ChipBaseProps {
  label: string;
  checked: boolean;
  count?: number;
  disabled?: boolean;
  name: string;
}

interface ChipCheckboxProps extends ChipBaseProps {
  type: "checkbox";
  onChange: (checked: boolean) => void;
}

interface ChipRadioProps extends ChipBaseProps {
  type: "radio";
  onChange: (value: string) => void;
  value: string;
}

type ChipProps = ChipCheckboxProps | ChipRadioProps;

export default function Chip(props: ChipProps) {
  const { type, label, checked, count, disabled, name } = props;

  // Use `props.type` (not destructured `type`) when accessing type-specific
  // props like `props.value` or `props.onChange` — TypeScript only narrows
  // the full `props` object, not standalone destructured variables.
  const handleChange = () => {
    if (disabled) return;
    if (props.type === "checkbox") {
      props.onChange(!checked);
    } else {
      props.onChange(props.value);
    }
  };

  const value = props.type === "radio" ? props.value : label;
  const inputId = `chip-${name}-${value}`.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        styles.chip,
        checked && styles.checked,
        disabled && styles.disabled,
      )}
    >
      <input
        type={type}
        id={inputId}
        name={name}
        value={props.type === "radio" ? props.value : undefined}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
      />
      <span className={styles.label}>{label}</span>
      {count !== undefined && (
        <span className={styles.count} aria-label={`${count} items`}>
          {count}
        </span>
      )}
      {type === "checkbox" && (
        <span className={styles.checkmark} aria-hidden="true">
          {checked && (
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
      )}
    </label>
  );
}

"use client";

import styles from "./chip.module.css";

interface ChipBaseProps {
  label: string;
  checked: boolean;
  count?: number;
  disabled?: boolean;
}

interface ChipCheckboxProps extends ChipBaseProps {
  type: "checkbox";
  onChange: (checked: boolean) => void;
  name?: string;
}

interface ChipRadioProps extends ChipBaseProps {
  type: "radio";
  onChange: (value: string) => void;
  name: string;
  value: string;
}

type ChipProps = ChipCheckboxProps | ChipRadioProps;

export default function Chip(props: ChipProps) {
  const { type, label, checked, count, disabled } = props;

  const handleChange = () => {
    if (disabled) return;
    if (type === "checkbox") {
      props.onChange(!checked);
    } else {
      props.onChange(props.value);
    }
  };

  const inputId = `chip-${props.type}-${type === "radio" ? props.value : label}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <label
      htmlFor={inputId}
      className={`${styles.chip} ${checked ? styles.checked : ""} ${disabled ? styles.disabled : ""}`}
    >
      <input
        type={type}
        id={inputId}
        name={type === "radio" ? props.name : props.name || label}
        value={type === "radio" ? props.value : undefined}
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

"use client";

import clsx from "clsx";
import styles from "./switch.module.css";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  /** Layout only — the switch stretches to its container, so a caller in a wide
   * column may need to change how the label and track sit within it. */
  className?: string;
  /** Can't be changed, and reads as such. */
  disabled?: boolean;
  /** The id of text explaining the switch, such as why it's disabled. */
  describedBy?: string;
}

export default function Switch({
  label,
  checked,
  onChange,
  id,
  className,
  disabled,
  describedBy,
}: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={clsx(styles.wrapper, disabled && styles.disabled, className)}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.knob} />
      </div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.input}
        disabled={disabled}
        aria-describedby={describedBy}
      />
    </label>
  );
}

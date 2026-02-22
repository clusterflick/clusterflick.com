"use client";

import styles from "./switch.module.css";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

export default function Switch({ label, checked, onChange, id }: SwitchProps) {
  return (
    <label htmlFor={id} className={styles.wrapper}>
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
      />
    </label>
  );
}

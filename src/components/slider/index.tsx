"use client";

import type { CSSProperties } from "react";
import clsx from "clsx";
import styles from "./slider.module.css";

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Renders the value beside the label and as its accessible text. */
  formatValue: (value: number) => string;
  /** Layout only, as for `Switch`. */
  className?: string;
}

/**
 * A single-value slider on a native range input, so keyboard steps, touch
 * dragging and screen-reader announcements come from the platform. The value
 * is shown beside the label rather than on the thumb, where a finger would
 * cover it.
 */
export default function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  className,
}: SliderProps) {
  const formatted = formatValue(value);
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className={clsx(styles.wrapper, className)}>
      <div className={styles.header}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <output htmlFor={id} className={styles.value}>
          {formatted}
        </output>
      </div>
      <input
        type="range"
        id={id}
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={formatted}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
    </div>
  );
}

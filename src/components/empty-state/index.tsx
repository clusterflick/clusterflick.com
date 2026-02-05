import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import styles from "./empty-state.module.css";

interface IconProps {
  src: string;
  width: number;
  height: number;
}

interface EmptyStateProps {
  /** Icon to display */
  icon: IconProps;
  /** Optional title (displayed as h2) */
  title?: string;
  /** Main message text */
  message: ReactNode;
  /** Optional hint/secondary text */
  hint?: ReactNode;
  /** Optional action buttons */
  actions?: ReactNode;
  /**
   * Layout variant:
   * - "fullscreen": Takes up full viewport height, no background (for page-level empty states)
   * - "contained": Compact box with gradient background (for section-level empty states)
   */
  variant?: "fullscreen" | "contained";
}

/**
 * A reusable empty state component for displaying "no results" or error messages.
 * Supports two variants for different contexts.
 */
export default function EmptyState({
  icon,
  title,
  message,
  hint,
  actions,
  variant = "contained",
}: EmptyStateProps) {
  const variantClass =
    variant === "fullscreen" ? styles.fullscreen : styles.contained;

  return (
    <div className={clsx(styles.emptyState, variantClass)}>
      <Image
        src={icon.src}
        alt=""
        width={icon.width}
        height={icon.height}
        className={styles.icon}
      />
      {title && <h2 className={styles.title}>{title}</h2>}
      <p className={styles.message}>{message}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

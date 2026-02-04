import Spinner from "@/components/spinner";
import styles from "./loading-indicator.module.css";

type Size = "sm" | "md" | "lg";

const spinnerSizes: Record<Size, number> = {
  sm: 28,
  md: 40,
  lg: 48,
};

interface LoadingIndicatorProps {
  /** Loading message to display */
  message?: string;
  /** Size variant affects spinner size and spacing */
  size?: Size;
  /** Additional className for custom styling */
  className?: string;
}

/**
 * A consistent loading indicator with spinner and optional message.
 * Use for any loading state that needs a spinner + text.
 */
export default function LoadingIndicator({
  message = "Loading...",
  size = "md",
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      className={`${styles.container} ${styles[size]} ${className || ""}`.trim()}
    >
      <Spinner size={spinnerSizes[size]} />
      {message && <span className={styles.message}>{message}</span>}
    </div>
  );
}

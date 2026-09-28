import clsx from "clsx";
import Button from "@/components/button";
import styles from "./data-load-notice.module.css";

interface DataLoadNoticeProps {
  /** Refetch the chunks that failed. */
  onRetry: () => void;
  /** Whether that refetch is in flight. */
  isRetrying?: boolean;
  /** Hide the notice for this failure. */
  onDismiss: () => void;
  className?: string;
}

/**
 * Says that part of the listings failed to load, and offers to fetch it again.
 *
 * A partial failure otherwise looks like an answer: the grid fills, searches
 * return results, and the films in the missing chunk read as not showing. This
 * is what tells the reader the page is incomplete rather than wrong.
 */
export default function DataLoadNotice({
  onRetry,
  isRetrying = false,
  onDismiss,
  className,
}: DataLoadNoticeProps) {
  return (
    <div className={clsx(styles.notice, className)} role="status">
      <div className={styles.text}>
        <p className={styles.headline}>Some listings didn&rsquo;t load</p>
        <p className={styles.detail}>
          A few films may be missing from results until they do.
        </p>
      </div>
      <div className={styles.actions}>
        <Button size="sm" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}

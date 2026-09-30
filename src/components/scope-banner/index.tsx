import Link from "next/link";
import clsx from "clsx";
import styles from "./scope-banner.module.css";

export interface ScopeBannerItem {
  id: string;
  /** What kind of thing it is, e.g. "Film club". */
  kind: string;
  name: string;
  /** The thing's own page. */
  href: string;
  onRemove: () => void;
}

interface ScopeBannerProps {
  items: ScopeBannerItem[];
  /** Merged onto the wrapper, for the spacing the placing page needs. */
  className?: string;
}

/**
 * Says what a grid has been narrowed *to*, rather than narrowed by. A film
 * club selected on the catalogue changes what the page is — its programme, not
 * the listings — so it is named above the grid with a way to take it off,
 * instead of being left to the filter overlay.
 */
export default function ScopeBanner({ items, className }: ScopeBannerProps) {
  if (items.length === 0) return null;

  return (
    <div className={clsx(styles.banner, className)}>
      <p className={styles.lead}>Only showing</p>
      <ul className={styles.items}>
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`} className={styles.item}>
            <span className={styles.kind}>{item.kind}</span>
            <Link href={item.href} className={styles.name}>
              {item.name}
            </Link>
            <button
              type="button"
              className={styles.remove}
              onClick={item.onRemove}
              aria-label={`Stop showing only ${item.name}`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M1 1L9 9M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

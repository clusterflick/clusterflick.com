import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import NavCard from "@/components/nav-card";
import Tag from "@/components/tag";
import { BookmarkIcon } from "@/components/icons";
import styles from "./venue-card.module.css";

interface VenueCardProps {
  /** Omitted for a venue with no page, e.g. one that has left the dataset. */
  href?: string;
  name: string;
  type?: string;
  imagePath: string | null;
  filmCount?: number;
  performanceCount?: number;
  /** Leading item on the stats line, before the counts (e.g. a date range) */
  detail?: string;
  /** A control beneath the card, outside its link (e.g. Remove). */
  action?: ReactNode;
  /** Greyed out, e.g. while a removal can still be undone. */
  muted?: boolean;
  /** Drawn at the card's right edge, e.g. a film list's progress ring. */
  aside?: ReactNode;
  /**
   * A line of the reader's own under the counts, marked with the watchlist's
   * bookmark: what from their watchlist is on there.
   */
  watchlistNote?: string;
}

export default function VenueCard({
  href,
  name,
  type,
  imagePath,
  filmCount,
  performanceCount,
  detail,
  action,
  muted = false,
  aside,
  watchlistNote,
}: VenueCardProps) {
  const hasCounts = filmCount !== undefined && performanceCount !== undefined;
  const countText = !hasCounts
    ? null
    : filmCount > 0
      ? `${filmCount.toLocaleString("en-GB")} ${filmCount === 1 ? "film" : "films"} · ${performanceCount.toLocaleString("en-GB")} ${performanceCount === 1 ? "screening" : "screenings"}`
      : "No screenings currently listed";
  const stats = [detail, countText].filter(Boolean).join(" · ");

  const card = (
    <NavCard href={href} className={clsx(styles.card, muted && styles.muted)}>
      <div className={styles.logo}>
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`${name} logo`}
            width={48}
            height={48}
            className={styles.image}
          />
        ) : (
          <span className={styles.initial}>{name.charAt(0)}</span>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.name}>{name}</span>
        {type && (
          <div className={styles.meta}>
            <Tag color="blue" size="sm">
              {type}
            </Tag>
          </div>
        )}
        {stats && <span className={styles.stats}>{stats}</span>}
        {watchlistNote && (
          <span className={styles.watchlistNote}>
            <BookmarkIcon size={12} filled aria-hidden="true" />
            <span className={styles.watchlistText}>{watchlistNote}</span>
          </span>
        )}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </NavCard>
  );

  if (!action) return card;
  return (
    <div className={styles.withAction}>
      {card}
      <div className={styles.action}>{action}</div>
    </div>
  );
}

import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import NavCard from "@/components/nav-card";
import Tag from "@/components/tag";
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
  /** A control beside the card, outside its link (e.g. Remove). */
  action?: ReactNode;
  /** Greyed out, e.g. while a removal can still be undone. */
  muted?: boolean;
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
}: VenueCardProps) {
  const hasCounts = filmCount !== undefined && performanceCount !== undefined;
  const countText = !hasCounts
    ? null
    : filmCount > 0
      ? `${filmCount.toLocaleString("en-GB")} ${filmCount === 1 ? "film" : "films"} · ${performanceCount.toLocaleString("en-GB")} ${performanceCount === 1 ? "showing" : "showings"}`
      : "No showings currently listed";
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
      </div>
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

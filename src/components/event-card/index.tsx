import { type ReactNode } from "react";
import Image from "next/image";
import NavCard from "@/components/nav-card";
import styles from "./event-card.module.css";

export interface EventCardProps {
  href: string;
  name: string;
  imagePath: string | null;
  description: string | null;
  /** Bottom meta row — caller provides domain-specific content (dates, film count, etc.) */
  meta: ReactNode;
}

/**
 * A clickable card for curated film programmes such as festivals and film clubs.
 * Renders a centred logo (with a placeholder when no image is available), a
 * two-line-clamped name, a three-line-clamped description, and a flexible meta
 * row supplied by the caller.
 *
 * **When to use:**
 * - Listing pages for festivals, film clubs, or any named film programme.
 *
 * **When NOT to use:**
 * - Venue listings — use `VenueCard` instead.
 * - Movie posters — use `FilmPosterGrid`.
 * - External links — use `LinkCard`.
 */
export default function EventCard({
  href,
  name,
  imagePath,
  description,
  meta,
}: EventCardProps) {
  return (
    <NavCard href={href} className={styles.card}>
      <div className={styles.logo}>
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`${name} logo`}
            width={96}
            height={96}
            className={styles.logoImage}
          />
        ) : (
          <div className={styles.logoPlaceholder} />
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.name} data-testid="event-card-name">
          {name}
        </div>
        <p className={styles.description}>
          {description
            ? description.charAt(0).toUpperCase() + description.slice(1)
            : ""}
        </p>
        <div className={styles.meta}>{meta}</div>
      </div>
    </NavCard>
  );
}

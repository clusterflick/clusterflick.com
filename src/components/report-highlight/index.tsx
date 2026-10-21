import clsx from "clsx";
import VenueCard from "@/components/venue-card";
import { StarIcon } from "@/components/icons";
import styles from "./report-highlight.module.css";

type Variant = "winner" | "mention";

const variantStyles: Record<Variant, string> = {
  winner: styles.winner,
  mention: styles.mention,
};

const variantLabels: Record<Variant, string> = {
  winner: "Winner",
  mention: "Special mention",
};

interface ReportHighlightProps {
  variant?: Variant;
  /** What the venue stands out for, e.g. "Most adventurous programme". */
  title: string;
  /** The number it won with, e.g. "86%". */
  stat: string;
  /** What the number means, e.g. "of screenings were of films 25+ years old". */
  statLabel: string;
  venue: {
    name: string;
    href?: string;
    type?: string;
    imagePath: string | null;
  };
}

/**
 * One venue singled out by a report: the measure it leads on, the number,
 * and the venue as a card.
 */
export default function ReportHighlight({
  variant = "winner",
  title,
  stat,
  statLabel,
  venue,
}: ReportHighlightProps) {
  return (
    <section className={clsx(styles.highlight, variantStyles[variant])}>
      <p className={styles.eyebrow}>
        <StarIcon size={14} filled />
        {variantLabels[variant]}
      </p>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.statLine}>
        <span className={styles.stat}>{stat}</span>{" "}
        <span className={styles.statLabel}>{statLabel}</span>
      </p>
      <VenueCard
        href={venue.href}
        name={venue.name}
        type={venue.type}
        imagePath={venue.imagePath}
      />
    </section>
  );
}

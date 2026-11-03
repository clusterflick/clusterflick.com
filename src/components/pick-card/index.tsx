import Link from "next/link";
import MoviePoster from "@/components/movie-poster";
import Tag from "@/components/tag";
import styles from "./pick-card.module.css";

export interface PickCardItem {
  /** Stable key for a list of cards. */
  id: string;
  href: string;
  title: string;
  posterPath?: string;
  /** Why the film is picked: "35mm print", "Final showing". */
  label: string;
  labelColor: "pink" | "blue" | "yellow" | "gray";
  /** "Akira Kurosawa · 1985". */
  credit?: string | null;
  /** The emphasised half of the footer: "Tomorrow, 19:30". */
  when?: string | null;
  /** The rest of the footer: the venue, or the film's reach. */
  where?: string | null;
}

interface PickCardProps {
  item: PickCardItem;
  /** Heading level for the title, to sit under the section's own. */
  headingLevel?: "h3" | "h4";
}

/**
 * One screening picked out for a reason: a poster, the reason as a label, the
 * film, and when and where. The whole card is one link to the film's page.
 */
export default function PickCard({
  item,
  headingLevel: Heading = "h3",
}: PickCardProps) {
  const { href, title, posterPath, label, labelColor, credit, when, where } =
    item;
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.poster}>
        <MoviePoster
          posterPath={posterPath}
          title={title}
          size="xsmall"
          interactive={false}
        />
      </div>
      <div className={styles.body}>
        <Tag color={labelColor} size="sm" className={styles.label}>
          {label}
        </Tag>
        <Heading className={styles.title}>{title}</Heading>
        {credit && <span className={styles.credit}>{credit}</span>}
        {(when || where) && (
          <span className={styles.footer}>
            {when && <strong>{when}</strong>}
            {when && where && " · "}
            {where}
          </span>
        )}
      </div>
    </Link>
  );
}

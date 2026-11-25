import Link from "next/link";
import OccasionCard from "@/components/occasion-card";
import PosterScroller from "@/components/poster-row/scroller";
import styles from "./occasion-row.module.css";

export interface OccasionRowItem {
  /** The film's id: its key, and what the reader's list markers look up. */
  id: string;
  href: string;
  /** The film. */
  title: string;
  posterPath?: string;
  /** The occasion, which leads the card: "Q&A with Mike Leigh". */
  occasion: string;
  /** "Mon 24 Aug, 19:30". */
  when: string;
  venue?: string | null;
}

interface OccasionRowProps {
  title: string;
  items: OccasionRowItem[];
  /** Optional explanatory line shown under the title. */
  intro?: string;
  /** Optional "see all" link shown beside the title. */
  seeAllHref?: string;
  seeAllLabel?: string;
}

/**
 * A titled, horizontally-scrolling row of `OccasionCard`s, which lead with what
 * makes a screening an occasion — the guest, the live score — in large type,
 * with the film beneath it. Renders nothing when empty.
 *
 * **When to use:**
 * - "More Than a Screening" on the home page, where the occasion is the reason
 *   to go and a poster's subtitle was too small to carry it.
 *
 * **When NOT to use:**
 * - Rows where the film is the point — use `PosterRow`.
 * - A short grid of picks each with a reason label — use `PickCard`.
 */
export default function OccasionRow({
  title,
  items,
  intro,
  seeAllHref,
  seeAllLabel = "See all",
}: OccasionRowProps) {
  if (items.length === 0) return null;

  return (
    <section className={styles.row}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className={styles.seeAll}>
            {seeAllLabel} →
          </Link>
        )}
      </div>
      {intro && <p className={styles.intro}>{intro}</p>}
      <PosterScroller scrollKey={title}>
        {items.map((item) => (
          <OccasionCard
            key={item.id}
            id={item.id}
            href={item.href}
            title={item.title}
            posterPath={item.posterPath}
            lead={item.occasion}
            when={item.when}
            venue={item.venue}
          />
        ))}
      </PosterScroller>
    </section>
  );
}

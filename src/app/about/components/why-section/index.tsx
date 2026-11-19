import Link from "next/link";
import { leadReasons, moreReasons } from "../../data";
import styles from "./why-section.module.css";

/**
 * Why Clusterflick over another guide, backing up the hero's claim. Set as a
 * statement rather than cards: the cards further down are things to do, and
 * these are claims to read, so only the small text links are clickable.
 */
export default function WhySection() {
  return (
    <section id="why-clusterflick" className={styles.section}>
      {/* The hero above makes the claim; this backs it up, so its heading is
          for screen readers and the outline only. */}
      <h2 className={styles.visuallyHidden}>Why Clusterflick</h2>

      <ul className={styles.leads}>
        {leadReasons.map((reason) => (
          <li key={reason.title} className={styles.lead}>
            <h3 className={styles.leadTitle}>{reason.title}</h3>
            <p className={styles.leadDescription}>{reason.description}</p>
            <Link href={reason.href}>
              {reason.linkLabel} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>

      <ul className={styles.more}>
        {moreReasons.map((reason) => (
          <li key={reason.title}>
            <h3 className={styles.moreTitle}>
              <Link href={reason.href}>{reason.title}</Link>
            </h3>
            <p className={styles.moreDescription}>{reason.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { GROUPED_NAV_LINKS } from "@/utils/nav-links";
import styles from "./site-footer.module.css";

/**
 * The site-wide footer: every navigable page, grouped the same way the
 * hamburger menu groups them.
 *
 * It exists because the menu was the only route between sections — a single
 * affordance a reader has to open before they can see where they can go. The
 * footer puts the same map at the bottom of every page, where people look for
 * it, and gives crawlers a flat set of links to every section rather than a
 * chain through the films grid.
 */
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.groups}>
          {GROUPED_NAV_LINKS.map(({ id, label, links }) => (
            <nav
              key={id}
              className={styles.group}
              aria-label={`${label} links`}
            >
              <h2 className={styles.groupHeading}>{label}</h2>
              <ul className={styles.list}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className={styles.colophon}>
          Clusterflick brings every film screening across 400+ London venues
          into one place.
        </p>
      </div>
    </footer>
  );
}

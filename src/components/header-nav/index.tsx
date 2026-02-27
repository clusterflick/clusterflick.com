import Link from "next/link";
import { NAV_LINKS, setUseBrowserBack } from "@/utils/nav-links";
import styles from "./header-nav.module.css";

export default function HeaderNav() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      {NAV_LINKS.map(({ href, label }) => (
        <Link key={href} href={href} onClick={setUseBrowserBack}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

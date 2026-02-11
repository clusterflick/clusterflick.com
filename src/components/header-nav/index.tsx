import Link from "next/link";
import styles from "./header-nav.module.css";

export default function HeaderNav() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <Link
        href="/venues"
        onClick={() => {
          try {
            sessionStorage.setItem("useBrowserBack", "true");
          } catch {
            // Ignore - UX optimization only
          }
        }}
      >
        Venues
      </Link>
      <Link
        href="/about"
        onClick={() => {
          try {
            sessionStorage.setItem("useBrowserBack", "true");
          } catch {
            // Ignore - UX optimization only
          }
        }}
      >
        About
      </Link>
    </nav>
  );
}

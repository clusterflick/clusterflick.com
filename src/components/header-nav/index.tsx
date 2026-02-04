import Link from "next/link";
import styles from "./header-nav.module.css";

export default function HeaderNav() {
  return (
    <div className={styles.nav}>
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
    </div>
  );
}

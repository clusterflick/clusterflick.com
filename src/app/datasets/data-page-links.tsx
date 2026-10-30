import { ButtonLink } from "@/components/button";
import styles from "./data-page-links.module.css";

export type DataPage = "datasets" | "licence" | "status";

const PAGES: Array<{ page: DataPage; href: string; label: string }> = [
  { page: "datasets", href: "/datasets", label: "About the datasets" },
  { page: "licence", href: "/data-licence", label: "View the data licence" },
  {
    page: "status",
    href: "/datasets/status",
    label: "See the release history",
  },
];

/**
 * The other two of the three published-data pages - what the datasets are,
 * the terms they're under and their release history - as a centred row of
 * buttons. One list, in one order, so each page points at the others the same
 * way and under the same names. A page outside the three (/bot) leaves out
 * `current` and gets all of them.
 */
export default function DataPageLinks({ current }: { current?: DataPage }) {
  return (
    <p className={styles.links}>
      {PAGES.filter(({ page }) => page !== current).map(({ href, label }) => (
        <ButtonLink key={href} href={href} variant="secondary">
          {label}
        </ButtonLink>
      ))}
    </p>
  );
}

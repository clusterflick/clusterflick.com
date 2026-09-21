import type { Metadata } from "next";
import PageWrapper from "@/components/page-wrapper";
import PageContent from "./page-content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Planner — What's On in London, Day by Day",
  description:
    "Plan a day at the cinema: every film showing across your chosen London cinemas, one day at a time, with each film's screening times side by side.",
  alternates: {
    canonical: "/planner",
  },
  // A spike: the page is entirely client-rendered from filter state, so there
  // is nothing for a crawler to read yet. Revisit if it graduates.
  robots: { index: false, follow: true },
};

export default function PlannerPage() {
  return (
    <PageWrapper className={styles.page}>
      <PageContent />
    </PageWrapper>
  );
}

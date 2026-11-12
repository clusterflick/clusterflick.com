import type { ReactNode } from "react";
import clsx from "clsx";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

/**
 * One part of the profile settings. Unnumbered: a reader coming back to
 * change one thing is editing a profile, not following a setup wizard.
 */
export default function SettingsCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={clsx(personaliseStyles.card, styles.card)}>
      <h2 className={styles.cardTitle}>{title}</h2>
      {intro && <p className={personaliseStyles.managementText}>{intro}</p>}
      {children}
    </section>
  );
}

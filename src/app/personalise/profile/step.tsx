import type { ReactNode } from "react";
import clsx from "clsx";
import type { PublicProfileState } from "@/app/personalise/public-profile";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

/** What every step is given: the saved profile, and how to replace it. */
export type StepProps = Pick<PublicProfileState, "profile" | "onSaved">;

/** One numbered card of the settings, in the order they're done. */
export default function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={clsx(personaliseStyles.card, styles.step)}>
      <h2 className={styles.stepTitle}>
        <span className={styles.stepNumber} aria-hidden="true">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

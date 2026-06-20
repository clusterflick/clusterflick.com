import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import styles from "./content-section.module.css";

type HeadingLevel = "h2" | "h3" | "h4";

interface IconProps {
  src: string;
  width: number;
  height: number;
  className?: string;
}

interface ContentSectionProps {
  /** Section title */
  title: string;
  /** Optional icon displayed next to the title */
  icon?: IconProps;
  /** Optional intro text displayed below the title */
  intro?: ReactNode;
  /** Heading level for the title (default: "h2") */
  as?: HeadingLevel;
  /** Text alignment (default: "left") */
  align?: "left" | "center";
  /** Optional action (e.g. a "see all" link) rendered top-right of the title */
  action?: ReactNode;
  /** Section content */
  children?: ReactNode;
  /** Optional className for the section container */
  className?: string;
}

/**
 * A flexible section component for page content with optional icon and intro text.
 * Used across pages for consistent section styling.
 */
export default function ContentSection({
  title,
  icon,
  intro,
  as: Heading = "h2",
  align = "left",
  action,
  children,
  className = "",
}: ContentSectionProps) {
  const alignmentClass = align === "center" ? styles.centered : "";

  const heading = (
    <Heading className={styles.title}>
      {icon && (
        <Image
          src={icon.src}
          alt={title}
          width={icon.width}
          height={icon.height}
          className={clsx(styles.icon, icon.className)}
        />
      )}
      {title}
    </Heading>
  );

  return (
    <section className={clsx(styles.section, alignmentClass, className)}>
      {action ? (
        <div className={styles.titleRow}>
          {heading}
          <div className={styles.action}>{action}</div>
        </div>
      ) : (
        heading
      )}
      {intro && <p className={styles.intro}>{intro}</p>}
      {children}
    </section>
  );
}

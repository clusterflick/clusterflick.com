import { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import styles from "./link-card.module.css";

type CardVariant = "rating" | "social" | "contact" | "feature";

interface LinkCardProps {
  href: string;
  variant?: CardVariant;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
}

export default function LinkCard({
  href,
  variant = "rating",
  className = "",
  "aria-label": ariaLabel,
  children,
}: LinkCardProps) {
  const cardClassName = clsx(styles.card, styles[variant], className);

  // A site path stays in the tab, routed client-side; anywhere else opens in a
  // new one, as every card here did before internal links existed.
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cardClassName} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClassName}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

interface ChildrenProps {
  children: ReactNode;
}

export function CardLabel({ children }: ChildrenProps) {
  return <div className={styles.label}>{children}</div>;
}

export function CardValue({ children }: ChildrenProps) {
  return <div className={styles.value}>{children}</div>;
}

export function CardSubtext({ children }: ChildrenProps) {
  return <div className={styles.subtext}>{children}</div>;
}

export function CardTitle({ children }: ChildrenProps) {
  return <h3 className={styles.title}>{children}</h3>;
}

export function CardDescription({ children }: ChildrenProps) {
  return <p className={styles.description}>{children}</p>;
}

export function CardIcon({ children }: ChildrenProps) {
  return <div className={styles.icon}>{children}</div>;
}

export function CardContent({ children }: ChildrenProps) {
  return <span className={styles.content}>{children}</span>;
}

export function CardArrow() {
  return <div className={styles.arrow}>→</div>;
}

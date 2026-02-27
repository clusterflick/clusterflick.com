import Link from "next/link";
import clsx from "clsx";
import styles from "./nav-card.module.css";

interface NavCardProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * A shared wrapper for internal navigation cards.
 * Provides the standard background, border, lift-and-glow hover animation.
 * Pass a className for page-specific layout (padding, border-radius, flex direction).
 */
export default function NavCard({ href, className, children }: NavCardProps) {
  return (
    <Link href={href} className={clsx(styles.card, className)}>
      {children}
    </Link>
  );
}

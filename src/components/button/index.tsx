import { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "link";
type Size = "sm" | "md";

const variantStyles: Record<Variant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  link: styles.link,
};

const sizeStyles: Record<Size, string> = {
  sm: styles.sm,
  md: styles.md,
};

/**
 * Get the combined className for button styling.
 * Useful when you need button styles on a custom element.
 */
function getButtonClassName(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
): string {
  return `${styles.button} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={getButtonClassName(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * An anchor (`<a>`) styled as a button. Use for external links that open in a
 * new tab — pass `target="_blank"` and `rel="noopener noreferrer"` as needed.
 * For internal navigation use `ButtonLink` instead.
 */
export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a className={getButtonClassName(variant, size, className)} {...props}>
      {children}
    </a>
  );
}

/**
 * A Link styled as a button. Use for navigation actions.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={getButtonClassName(variant, size, className)}>
      {children}
    </Link>
  );
}

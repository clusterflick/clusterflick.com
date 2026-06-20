import clsx from "clsx";
import styles from "./outline-heading.module.css";

type ColorVariant = "pink" | "blue";

const colorStyles: Record<ColorVariant, string> = {
  pink: styles.pink,
  blue: styles.blue,
};

interface OutlineHeadingProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "div";
  color?: ColorVariant;
}

export default function OutlineHeading({
  children,
  className = "",
  as: Component = "h1",
  color = "pink",
}: OutlineHeadingProps) {
  // The outlined duplicate is drawn with a ::before pseudo-element sourced from
  // `data-text`, not a second text node, so the heading's text content — and
  // what search engines read — appears only once. Requires `children: string`.
  return (
    <Component
      className={clsx(styles.heading, colorStyles[color], className)}
      data-text={children}
    >
      {children}
    </Component>
  );
}

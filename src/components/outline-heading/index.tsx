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
  as?: "h1" | "h2" | "h3";
  color?: ColorVariant;
}

export default function OutlineHeading({
  children,
  className = "",
  as: Component = "h1",
  color = "pink",
}: OutlineHeadingProps) {
  return (
    <Component className={clsx(styles.heading, className)}>
      <span
        className={clsx(styles.overlap, colorStyles[color])}
        aria-hidden="true"
      >
        {children}
      </span>
      {children}
    </Component>
  );
}

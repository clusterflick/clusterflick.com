import Image from "next/image";
import OutlineHeading from "@/components/outline-heading";
import styles from "./group-header.module.css";

type HeadingLevel = "h1" | "h2" | "h3";

interface GroupHeaderProps {
  /** Icon image source path */
  icon: string;
  /** Icon width in pixels */
  iconWidth: number;
  /** Icon height in pixels */
  iconHeight: number;
  /** Header title text */
  title: string;
  /** Heading level (default: "h2") */
  as?: HeadingLevel;
  /** Outline heading color (default: "blue") */
  color?: "pink" | "blue";
  /** Optional additional className */
  className?: string;
}

/**
 * A decorative group header with an icon and outlined heading.
 * Used to introduce major content sections on a page.
 */
export default function GroupHeader({
  icon,
  iconWidth,
  iconHeight,
  title,
  as = "h2",
  color = "blue",
  className = "",
}: GroupHeaderProps) {
  return (
    <div className={`${styles.groupHeader} ${className}`}>
      <Image
        src={icon}
        alt=""
        width={iconWidth}
        height={iconHeight}
        className={styles.icon}
      />
      <OutlineHeading as={as} className={styles.title} color={color}>
        {title}
      </OutlineHeading>
    </div>
  );
}

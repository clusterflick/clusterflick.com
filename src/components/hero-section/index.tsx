import type { ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";
import styles from "./hero-section.module.css";

type BackdropHeight = "standard" | "extended";
type Alignment = "left" | "center";

const heightStyles: Record<BackdropHeight, string> = {
  standard: styles.heightStandard,
  extended: styles.heightExtended,
};

const alignStyles: Record<Alignment, string> = {
  left: styles.alignLeft,
  center: styles.alignCenter,
};

interface HeroSectionProps {
  /** Background image source */
  backgroundImage: string;
  /** Alt text for the background image */
  backgroundImageAlt?: string;
  /** Backdrop height variant */
  backdropHeight?: BackdropHeight;
  /** Content alignment */
  align?: Alignment;
  /** Content to render inside the hero */
  children: ReactNode;
  /** Additional className for the hero wrapper */
  className?: string;
  /** Additional className for the content area */
  contentClassName?: string;
}

/**
 * A reusable hero section with blurred background image and gradient overlay.
 * Provides consistent hero styling across pages.
 */
export default function HeroSection({
  backgroundImage,
  backgroundImageAlt = "",
  backdropHeight = "standard",
  align = "left",
  children,
  className,
  contentClassName,
}: HeroSectionProps) {
  return (
    <div className={clsx(styles.hero, alignStyles[align], className)}>
      <div className={clsx(styles.backdrop, heightStyles[backdropHeight])}>
        <Image
          src={backgroundImage}
          alt={backgroundImageAlt}
          fill
          className={styles.backdropImage}
          priority
        />
        <div className={styles.backdropOverlay} />
      </div>

      <div className={clsx(styles.heroContent, contentClassName)}>
        {children}
      </div>
    </div>
  );
}

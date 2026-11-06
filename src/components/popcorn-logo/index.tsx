import type { CSSProperties } from "react";
import clsx from "clsx";
import {
  BOX_PATH,
  ICON_KERNEL_PATH,
  ICON_KERNEL_TRANSFORM,
  ICON_TRANSFORM,
  KERNELS,
  VIEW_BOX,
} from "./paths";
import styles from "./popcorn-logo.module.css";

interface PopcornLogoProps {
  /** Rendered width and height, in pixels. Defaults to 200. */
  size?: number;
  className?: string;
}

/**
 * The Clusterflick popcorn, drawn inline so its kernels can move: they pop out
 * of the box one after another as the page loads, and hop when the pointer is
 * over it. Readers who prefer reduced motion see it at rest.
 */
export default function PopcornLogo({
  size = 200,
  className,
}: PopcornLogoProps) {
  return (
    <svg
      viewBox={VIEW_BOX}
      width={size}
      height={size}
      className={clsx(styles.logo, className)}
      role="img"
      aria-label="Clusterflick logo"
    >
      <g fill="#fade05">
        {KERNELS.map((kernel) => (
          <g
            key={kernel.order}
            className={styles.kernel}
            style={
              {
                "--rise": `${kernel.rise}px`,
                "--order": kernel.order,
              } as CSSProperties
            }
          >
            <path d={kernel.d} className={styles.hop} />
          </g>
        ))}
      </g>
      <path d={BOX_PATH} fill="#f12869" className={styles.box} />
      <g transform={ICON_TRANSFORM}>
        <circle cx="100" cy="100" fill="#319edb" r="72" />
        <circle cx="100" cy="100" fill="#010013" r="60" />
        <path
          d={ICON_KERNEL_PATH}
          fill="#fade05"
          transform={ICON_KERNEL_TRANSFORM}
        />
      </g>
    </svg>
  );
}

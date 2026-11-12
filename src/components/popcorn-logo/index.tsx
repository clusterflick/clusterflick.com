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
  /**
   * Knocked over: the box tips onto its side and the kernels tumble out
   * across the floor. Wider than it is tall, so `size` is its width.
   */
  spilled?: boolean;
  className?: string;
}

/** The spilled scene's frame: the floor, with the box lying on it. */
const SPILLED_VIEW_BOX = "0 300 950 620";

/**
 * Where each kernel comes to rest when spilled, in viewBox units: the
 * centre it lands on (from its own centre in the logo, the `from` box below)
 * and how far it has turned. In `KERNELS` order. The big ones pile up by the
 * mouth of the box, the small ones roll furthest.
 */
const SPILL: ReadonlyArray<{
  from: [number, number];
  to: [number, number];
  turn: number;
}> = [
  { from: [472, 73], to: [118, 840], turn: 35 },
  { from: [630, 147], to: [52, 755], turn: -25 },
  { from: [342, 162], to: [352, 808], turn: 12 },
  { from: [199, 175], to: [36, 850], turn: 70 },
  { from: [757, 200], to: [868, 857], turn: -40 },
  { from: [485, 200], to: [226, 817], turn: -15 },
  { from: [601, 308], to: [168, 728], turn: 22 },
  { from: [236, 309], to: [262, 690], turn: -35 },
  { from: [380, 314], to: [338, 650], turn: 48 },
  { from: [486, 315], to: [918, 860], turn: 90 },
  { from: [122, 323], to: [470, 878], turn: -60 },
  { from: [745, 324], to: [300, 735], turn: 8 },
];

/**
 * The Clusterflick popcorn, drawn inline so its kernels can move: they pop out
 * of the box one after another as the page loads, and hop when the pointer is
 * over it. Spilled, the box tips over and they tumble out instead. Readers who
 * prefer reduced motion see either at rest.
 */
export default function PopcornLogo({
  size = 200,
  spilled = false,
  className,
}: PopcornLogoProps) {
  return (
    <svg
      viewBox={spilled ? SPILLED_VIEW_BOX : VIEW_BOX}
      width={size}
      height={spilled ? (size * 620) / 950 : size}
      className={clsx(styles.logo, spilled && styles.spilled, className)}
      role="img"
      aria-label={
        spilled ? "The Clusterflick popcorn, spilled" : "Clusterflick logo"
      }
    >
      <g fill="#fade05">
        {KERNELS.map((kernel, index) => {
          const { from, to, turn } = SPILL[index];
          return (
            <g
              key={kernel.order}
              className={styles.kernel}
              style={
                {
                  "--rise": `${kernel.rise}px`,
                  "--order": kernel.order,
                  "--spill-x": `${to[0] - from[0]}px`,
                  "--spill-y": `${to[1] - from[1]}px`,
                  "--spill-turn": `${turn}deg`,
                } as CSSProperties
              }
            >
              <path d={kernel.d} className={styles.hop} />
            </g>
          );
        })}
      </g>
      {/* The box and its badge, which tip over together. */}
      <g className={styles.bucket}>
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
      </g>
    </svg>
  );
}

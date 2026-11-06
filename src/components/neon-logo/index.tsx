import Image from "next/image";
import clsx from "clsx";
import styles from "./neon-logo.module.css";

export interface NeonLogoProps {
  /** A neon sign drawn on its own dark tile, such as a genre icon. */
  src: string;
  /** Width and height in pixels. */
  size: number;
  /** Keep the sign lit, rather than lighting it when its link is hovered. */
  lit?: boolean;
  className?: string;
}

/**
 * A logo that is a neon sign: drawn edge to edge, since the art is its own
 * dark tile, and lit up when the link around it is hovered or focused, with a
 * brief flicker as it comes on.
 *
 * The glow is a blurred copy of the sign screened over it, so each sign
 * blooms in its own colours (a pink skull glows pink, a gold star gold) and
 * no colour has to be kept beside the art.
 *
 * **When to use:**
 * - Inside a card's link, for art made as a neon sign on a dark tile — the
 *   genre icons. `ProgrammeCard` and `EventCard` take it through `neonLogo`.
 *
 * **When NOT to use:**
 * - A real organisation's logo — it isn't a sign, and screening it over the
 *   card would wash it out. Use the cards' ordinary logo.
 */
export default function NeonLogo({
  src,
  size,
  lit = false,
  className,
}: NeonLogoProps) {
  return (
    <div
      className={clsx(styles.sign, lit && styles.lit, className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={styles.image}
      />
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={styles.glow}
      />
    </div>
  );
}

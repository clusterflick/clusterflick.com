import clsx from "clsx";
import {
  buildSocialLinks,
  type SocialHandles,
} from "@/utils/build-social-links";
import styles from "./social-links.module.css";

interface SocialLinksProps {
  /** Handles to render (venue or cinema group). Missing/empty renders nothing. */
  socials: SocialHandles | undefined;
  /** Icon size in pixels. */
  iconSize?: number;
  className?: string;
}

/**
 * A row of outbound social icon links (Letterboxd, Instagram, X/Twitter) built
 * from a set of handles via `buildSocialLinks`. Renders nothing when there are
 * no handles. Used on venue detail pages and cinema group pages so both share a
 * single markup + styling source.
 */
export default function SocialLinks({
  socials,
  iconSize = 20,
  className,
}: SocialLinksProps) {
  const links = buildSocialLinks(socials);
  if (links.length === 0) return null;

  return (
    <div className={clsx(styles.row, className)}>
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          title={link.name}
        >
          <link.Icon size={iconSize} />
        </a>
      ))}
    </div>
  );
}

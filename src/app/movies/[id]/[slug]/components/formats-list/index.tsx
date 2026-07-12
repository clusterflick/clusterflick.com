import Link from "next/link";
import PillList from "@/components/pill-list";
import type { FormatDefinition } from "@/data/formats";
import { getFormatUrl } from "@/utils/get-format-url";
import styles from "./formats-list.module.css";

interface FormatsListProps {
  formats: FormatDefinition[];
  /**
   * Where the list is rendered, which drives the heading style:
   * - "poster": under the poster on desktop — heading matches "Also showing as
   *   part of:".
   * - "inline": under "Playing at" on mobile — heading matches "Playing at".
   */
  variant: "poster" | "inline";
}

/**
 * The special formats a film screens in (70mm, IMAX, 3D, …), reusing the
 * "Playing at" pill + link layout, with each pill linking to that format's
 * landing page. Renders nothing when the film has no non-default formats.
 */
export default function FormatsList({ formats, variant }: FormatsListProps) {
  if (!formats || formats.length === 0) {
    return null;
  }

  return (
    <PillList
      title="Screening in"
      titleClassName={variant === "poster" ? styles.labelPoster : undefined}
      align={variant === "poster" ? "center" : "start"}
      itemNoun="formats"
      items={formats}
      renderItem={(format) => (
        <Link href={getFormatUrl(format)}>{format.name}</Link>
      )}
    />
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { UpdateVenue } from "@/utils/get-updates";
import styles from "./page.module.css";

/** A chain rolling out one film can name thirty venues; ten reads as a list. */
const COLLAPSED_COUNT = 10;

/**
 * "A", "A and B", "A, B and C" — venues link where the venue page exists.
 *
 * Long lists collapse to the first ten with a toggle for the rest. There is no
 * matching "hide": once a reader has asked for the names, collapsing them back
 * under them only takes away what they asked for.
 */
export default function VenueList({
  venues,
  className,
}: {
  venues: UpdateVenue[];
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);

  // Collapsing to hide a single venue costs a click and saves nothing, so the
  // toggle only appears once it hides at least two.
  const isCollapsed = !showAll && venues.length > COLLAPSED_COUNT + 1;
  const visible = isCollapsed ? venues.slice(0, COLLAPSED_COUNT) : venues;
  const hidden = venues.length - visible.length;

  // The toggle takes the place of the final venue, so a collapsed list runs on
  // into it — "A, B, and 9 more" — rather than ending on "A, B and C".
  const separator = (index: number) => {
    if (isCollapsed) return index === visible.length - 1 ? ", and " : ", ";
    if (index === visible.length - 2) return " and ";
    return index < visible.length - 2 ? ", " : null;
  };

  return (
    <span className={className}>
      {visible.map((venue, index) => (
        <span key={venue.id}>
          {venue.href ? (
            <Link href={venue.href}>{venue.name}</Link>
          ) : (
            venue.name
          )}
          {separator(index)}
        </span>
      ))}
      {isCollapsed && (
        <button
          type="button"
          className={styles.moreToggle}
          onClick={() => setShowAll(true)}
          aria-label={`Show all ${venues.length.toLocaleString("en-GB")} venues`}
        >
          {hidden.toLocaleString("en-GB")} more (show all)
        </button>
      )}
    </span>
  );
}

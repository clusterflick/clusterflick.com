"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { condenseVenues } from "@/utils/condense-venues";
import type { UpdateVenue } from "@/utils/get-updates";
import styles from "./updates.module.css";

/**
 * Three items is a phrase; past that, a rollout's venue list was the bulk of
 * the page. Items, not venues: "9 Cineworld" is one.
 */
const COLLAPSED_COUNT = 3;

function VenueName({ venue }: { venue: UpdateVenue }) {
  return venue.href ? <Link href={venue.href}>{venue.name}</Link> : venue.name;
}

/**
 * "A", "A and B", "A, B and C" — venues link where the venue page exists.
 *
 * Collapsed, chains with more than one venue in the list are counted rather
 * than named ("9 Cineworld") and the list stops at three items, with a toggle
 * for every name (see `condenseVenues`). There is no matching "hide": once a
 * reader has asked for the names, collapsing them back under them only takes
 * away what they asked for.
 */
export default function VenueList({
  venues,
  className,
}: {
  venues: UpdateVenue[];
  className?: string;
}) {
  const [showAll, setShowAll] = useState(false);

  const condensed = condenseVenues(venues, COLLAPSED_COUNT);
  const isCollapsed = !showAll && condensed.isCondensed;

  const items: Array<{ key: string; node: ReactNode }> = isCollapsed
    ? condensed.entries.map((entry) =>
        entry.kind === "venue"
          ? { key: entry.venue.id, node: <VenueName venue={entry.venue} /> }
          : {
              key: entry.group.href,
              node: (
                <Link href={entry.group.href}>
                  {/* A list that is one chain throughout already has its count
                      ahead of it ("at 9 venues:"), so it names the chain alone */}
                  {entry.count === venues.length
                    ? `all ${entry.group.name}`
                    : `${entry.count.toLocaleString("en-GB")} ${entry.group.name}`}
                </Link>
              ),
            },
      )
    : venues.map((venue) => ({
        key: venue.id,
        node: <VenueName venue={venue} />,
      }));

  const hidden = isCollapsed ? condensed.hiddenVenues : 0;

  // The "more" count stands in for a final item, so a cut list runs on into it
  // — "A, B, C and 9 more" — rather than ending on "A, B and C".
  const count = items.length + (hidden > 0 ? 1 : 0);
  const separator = (index: number) => {
    if (index === count - 2) return " and ";
    return index < count - 2 ? ", " : null;
  };

  return (
    <span className={className}>
      {items.map(({ key, node }, index) => (
        <span key={key}>
          {node}
          {separator(index)}
        </span>
      ))}
      {isCollapsed && (
        <>
          {/* Nothing cut, only chains counted: the toggle trails the list */}
          {hidden === 0 && " "}
          <button
            type="button"
            className={styles.moreToggle}
            onClick={() => setShowAll(true)}
            aria-label={`Show all ${venues.length.toLocaleString("en-GB")} venues`}
          >
            {hidden > 0
              ? `${hidden.toLocaleString("en-GB")} more (show all)`
              : "(show all)"}
          </button>
        </>
      )}
    </span>
  );
}

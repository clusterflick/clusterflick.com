"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { VenueGroupData } from "./page";
import { normalizeForSearch } from "@/lib/filters/normalize";
import { VENUE_GROUPS } from "@/data/venue-groups";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import LinkGrid from "@/components/link-grid";
import SearchInput from "@/components/search-input";
import styles from "./page.module.css";

// Chains that have a dedicated /cinema-groups page, keyed by the group label
// used in the venue list (which equals `venue.groupName`).
const GROUP_SLUG_BY_LABEL = new Map(
  VENUE_GROUPS.map((group) => [group.groupName, group.slug]),
);

interface VenueListProps {
  groups: VenueGroupData[];
}

export default function VenueList({ groups }: VenueListProps) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;

    const q = normalizeForSearch(query);
    return groups
      .map((group) => ({
        ...group,
        venues: group.venues.filter((v) =>
          normalizeForSearch(v.name).includes(q),
        ),
      }))
      .filter((group) => group.venues.length > 0);
  }, [groups, query]);

  const matchCount = filteredGroups.reduce(
    (sum, g) => sum + g.venues.length,
    0,
  );

  return (
    <>
      <SearchInput
        id="venues-search"
        className={styles.searchWrapper}
        placeholder="Filter venues..."
        ariaLabel="Filter venues"
        value={query}
        onChange={setQuery}
      />

      {query.trim() && (
        <p className={styles.searchResultCount}>
          Showing {matchCount.toLocaleString("en-GB")}{" "}
          {matchCount === 1 ? "venue" : "venues"}
        </p>
      )}

      {filteredGroups.map((group) => {
        const groupSlug = GROUP_SLUG_BY_LABEL.get(group.label);
        return (
          <section key={group.id} className={styles.group}>
            <h2 className={styles.groupTitle}>
              {group.label}
              <span className={styles.groupCount}>{group.venues.length}</span>
              {groupSlug && (
                <Link
                  href={getVenueGroupUrl({ slug: groupSlug })}
                  className={styles.groupLink}
                >
                  Group page →
                </Link>
              )}
            </h2>
            <LinkGrid
              items={group.venues.map((venue) => ({
                key: venue.href,
                href: venue.href,
                label: venue.displayName,
                count:
                  venue.eventCount > 0
                    ? venue.eventCount.toLocaleString("en-GB")
                    : undefined,
              }))}
            />
          </section>
        );
      })}

      {filteredGroups.length === 0 && (
        <p className={styles.noResults}>
          No venues match &ldquo;{query}&rdquo;
        </p>
      )}
    </>
  );
}

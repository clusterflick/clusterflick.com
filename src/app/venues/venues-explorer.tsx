"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { VenueGroupData } from "./page";
import {
  matchesSearchQuery,
  normalizeForSearch,
} from "@/lib/filters/normalize";
import { VENUE_GROUPS } from "@/data/venue-groups";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import LinkGrid from "@/components/link-grid";
import SearchInput from "@/components/search-input";
import StickyBar from "@/components/sticky-bar";
import Switch from "@/components/switch";
import VenueMap, { type VenueMapVenue } from "@/components/venue-map";
import styles from "./page.module.css";

// Chains that have a dedicated /cinema-groups page, keyed by the group label
// used in the venue list (which equals `venue.groupName`).
const GROUP_SLUG_BY_LABEL = new Map(
  VENUE_GROUPS.map((group) => [group.groupName, group.slug]),
);

interface VenuesExplorerProps {
  groups: VenueGroupData[];
  mapVenues: VenueMapVenue[];
  boundary?: GeoJSON.GeoJsonObject;
}

export default function VenuesExplorer({
  groups,
  mapVenues,
  boundary,
}: VenuesExplorerProps) {
  const [query, setQuery] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);

  const normalizedQuery = query.trim() ? normalizeForSearch(query) : "";
  const isFiltering = Boolean(normalizedQuery) || hideEmpty;

  // The same filters drive both the map markers and the list below it.
  const filteredMapVenues = useMemo(() => {
    if (!isFiltering) return mapVenues;

    return mapVenues.filter(
      (v) =>
        (!hideEmpty || v.filmCount > 0) &&
        (!normalizedQuery || matchesSearchQuery(v.name, normalizedQuery)),
    );
  }, [mapVenues, normalizedQuery, hideEmpty, isFiltering]);

  const filteredGroups = useMemo(() => {
    if (!isFiltering) return groups;

    return groups
      .map((group) => ({
        ...group,
        venues: group.venues.filter(
          (v) =>
            (!hideEmpty || v.eventCount > 0) &&
            (!normalizedQuery || matchesSearchQuery(v.name, normalizedQuery)),
        ),
      }))
      .filter((group) => group.venues.length > 0);
  }, [groups, normalizedQuery, hideEmpty, isFiltering]);

  const matchCount = filteredGroups.reduce(
    (sum, g) => sum + g.venues.length,
    0,
  );

  return (
    <>
      {/* Above the map it filters, and stuck under the header the whole way
          down the list, so changing the search never means scrolling back up
          past the map. */}
      <StickyBar className={styles.searchBar}>
        <div className={styles.searchControls}>
          <SearchInput
            id="venues-search"
            className={styles.search}
            placeholder="Filter venues..."
            ariaLabel="Filter venues"
            value={query}
            onChange={setQuery}
          />

          <div className={styles.searchMeta}>
            {/* Always rendered, so the bar keeps its height as the count
                comes and goes. */}
            <p className={styles.searchResultCount} aria-live="polite">
              {isFiltering &&
                `Showing ${matchCount.toLocaleString("en-GB")} ${
                  matchCount === 1 ? "venue" : "venues"
                }`}
            </p>

            <Switch
              id="venues-hide-empty"
              label="Hide venues with no showings"
              checked={hideEmpty}
              onChange={setHideEmpty}
            />
          </div>
        </div>
      </StickyBar>

      <div className={styles.mapSection}>
        <VenueMap venues={filteredMapVenues} boundary={boundary} bleed />
      </div>

      <div className={styles.column}>
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

        {filteredGroups.length === 0 &&
          (query.trim() ? (
            <p className={styles.noResults}>
              No venues match &ldquo;{query}&rdquo;
            </p>
          ) : (
            <p className={styles.noResults}>No venues have showings listed</p>
          ))}
      </div>
    </>
  );
}

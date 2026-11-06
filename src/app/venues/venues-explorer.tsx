"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import type { VenueGroupData } from "./page";
import {
  matchesSearchQuery,
  normalizeForSearch,
} from "@/lib/filters/normalize";
import { VENUE_GROUPS } from "@/data/venue-groups";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import LinkGrid from "@/components/link-grid";
import OutlineHeading from "@/components/outline-heading";
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

/** Follows an element's rendered height, which wrapping text can change. */
function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setHeight(element.getBoundingClientRect().height),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}

interface VenuesExplorerProps {
  /** The page's h1, laid over the top of the map. */
  title: string;
  /** Between the search bar and the list. */
  intro: ReactNode;
  groups: VenueGroupData[];
  mapVenues: VenueMapVenue[];
  boundary?: GeoJSON.GeoJsonObject;
}

export default function VenuesExplorer({
  title,
  intro,
  groups,
  mapVenues,
  boundary,
}: VenuesExplorerProps) {
  const [query, setQuery] = useState("");
  const [hideEmpty, setHideEmpty] = useState(false);
  // The map fills the screen less the search bar, so the bar sits on the
  // bottom edge until the page scrolls; the venues are framed below the title.
  const [barRef, barHeight] = useElementHeight<HTMLDivElement>();
  const [titleRef, titleBottom] = useElementHeight<HTMLDivElement>();

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
    <div
      className={styles.page}
      style={
        barHeight
          ? ({ "--search-bar-height": `${barHeight}px` } as CSSProperties)
          : undefined
      }
    >
      <section className={styles.mapHero}>
        <VenueMap
          venues={filteredMapVenues}
          boundary={boundary}
          fill
          cooperativeGestures
          insetTop={titleBottom ?? undefined}
        />
        {/* Over the map, not beside it, and transparent to the pointer so
            the map under it still pans and its pins still open. */}
        <div ref={titleRef} className={styles.titleOverlay}>
          <OutlineHeading className={styles.title}>{title}</OutlineHeading>
        </div>
      </section>

      {/* Straight after the map, so it rests on the bottom edge of the first
          screen and then sticks under the header the whole way down the
          list: changing the search never means scrolling back up. */}
      <StickyBar ref={barRef}>
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

      <div className={styles.column}>
        {intro}

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
    </div>
  );
}

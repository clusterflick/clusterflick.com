"use client";

import { forwardRef, useSyncExternalStore, type ComponentProps } from "react";
import clsx from "clsx";
import { VirtuosoGrid } from "react-virtuoso";
import type { Movie } from "@/types";
import MovieCell from "@/components/movie-cell";
import styles from "./virtualised-film-grid.module.css";

const POSTER_WIDTH = 200;
const POSTER_HEIGHT = 300;
const GAP = 8;

// Number of initial rows to eagerly load images for (above the fold)
const PRIORITY_ROWS = 2;

function subscribeToResize(onStoreChange: () => void) {
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

const getWindowWidth = () => window.innerWidth;

/**
 * The viewport width is external mutable state, so it is read through a store
 * rather than during render — `window.innerWidth` in a `useState` initialiser
 * is a render-phase read of a browser API, which concurrent rendering may
 * repeat or abandon.
 *
 * Returning null for the server snapshot also makes the component fail safe if
 * it is ever server-rendered: React uses this value for SSR *and* the hydrating
 * render, so the markup agrees, and the real width arrives immediately after.
 * Today's only consumer (the films grid) mounts client-side, so this snapshot
 * is insurance rather than a live code path — but the previous version asserted
 * in a comment that it "never renders server-side", and that assertion is what
 * produced a hydration mismatch the moment it was reused elsewhere.
 */
const getServerWindowWidth = () => null;

// VirtuosoGrid wrappers. The grid lays out and centres the fixed-size posters;
// the roles give the grid list/listitem semantics.
const GridList = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function GridList({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        role="list"
        className={clsx(styles.gridList, className)}
      />
    );
  },
);

const GridItem = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function GridItem({ className, ...props }, ref) {
    return <div {...props} ref={ref} role="listitem" className={className} />;
  },
);

export interface VirtualisedFilmGridItem {
  movie: Movie;
}

interface VirtualisedFilmGridProps {
  items: VirtualisedFilmGridItem[];
  /**
   * Link each film to its page with every performance shown, ignoring the
   * reader's active filters. Use where the grid is itself the selection.
   */
  showAll?: boolean;
  className?: string;
}

/**
 * Window-scrolled, virtualised grid of film posters.
 *
 * **When to use:**
 * - A client-rendered page listing the whole catalogue (thousands of films),
 *   where rendering every poster at once would be expensive.
 *
 * **When NOT to use:**
 * - Anything server-rendered. Virtuoso renders no items during SSR unless
 *   `initialItemCount` is set, so the films would be absent from the static
 *   HTML. Use `FilmPosterGrid`, which lays out identically (same 200px columns
 *   and 8px gap), renders everything, and supports badges and truncation.
 */
export default function VirtualisedFilmGrid({
  items,
  showAll,
  className,
}: VirtualisedFilmGridProps) {
  // null until the width is known — i.e. on the server and for the hydrating
  // render. See getServerWindowWidth above.
  const windowWidth = useSyncExternalStore<number | null>(
    subscribeToResize,
    getWindowWidth,
    getServerWindowWidth,
  );

  // Approximate the number of columns the grid will lay out. Layout itself is
  // handled by the CSS grid, not this value; we use it to eagerly load images
  // for the first PRIORITY_ROWS rows and to reserve the grid height below.
  // Null until the width is known — neither use has a sensible answer without
  // one, so both fall back rather than guess.
  const columnCount =
    windowWidth === null
      ? null
      : Math.max(1, Math.floor((windowWidth + GAP) / (POSTER_WIDTH + GAP)));

  // Which posters are above the fold is unknowable without a viewport width, so
  // nothing is eagerly loaded until there is one.
  const priorityCount = columnCount === null ? 0 : columnCount * PRIORITY_ROWS;

  // VirtuosoGrid only establishes its scroll height after measuring on mount —
  // one paint too late for browser/Next scroll restoration on back-navigation,
  // which then lands on a too-short page. The posters are a fixed 200x300, so we
  // reserve the full height up front instead. Columns come from the window width
  // (>= the grid's own width), so this estimate stays at or below virtuoso's
  // real height and can't leave a blank strip once virtuoso measures.
  // Omitted while the width is unknown: a server-rendered guess would be wrong
  // by a factor of the column count, and the markup has to match on hydration.
  const reservedHeight =
    columnCount === null
      ? undefined
      : Math.ceil(items.length / columnCount) * (POSTER_HEIGHT + GAP);

  return (
    <div
      className={clsx(styles.gridWrapper, className)}
      style={{ minHeight: reservedHeight }}
    >
      <VirtuosoGrid
        useWindowScroll
        increaseViewportBy={900}
        totalCount={items.length}
        // Keyed by film, not by index. Virtuoso's default index keys make a
        // filter change reuse the previous cell's DOM — React re-points the
        // existing <img> at a new src, and the browser holds the old poster on
        // screen until the new one decodes, so for a moment the grid shows the
        // films that were just filtered out. A per-film key swaps the element
        // instead, leaving the empty poster panel until the image arrives.
        computeItemKey={(index) => items[index].movie.id}
        components={{ List: GridList, Item: GridItem }}
        itemContent={(index) => (
          <MovieCell
            movie={items[index].movie}
            priority={index < priorityCount}
            showAll={showAll}
          />
        )}
      />
    </div>
  );
}

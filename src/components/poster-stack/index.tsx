"use client";

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import clsx from "clsx";
import Button from "@/components/button";
import EventPoster, {
  type EventPosterIncludedMovie,
} from "@/components/event-poster";
import { ChevronDownIcon } from "@/components/icons";
import { getTileColumnCount } from "@/components/poster-tile";
import { useElementWidth } from "@/hooks/use-element-width";
import styles from "./poster-stack.module.css";

/** A film drawn in the stack: what its poster needs. */
export interface PosterStackItem {
  id: string;
  title: string;
  posterPath?: string;
  /** A double bill's or marathon's films, for an event with no poster. */
  includedMovies?: EventPosterIncludedMovie[];
}

export interface PosterStackProps {
  /** Every film in the list, in the order the full list draws them. */
  items: PosterStackItem[];
  /** What the films are, for the button's name: "Seen", "Showing now". */
  label: string;
  /**
   * The full list, drawn once the stack is opened: a `PosterTileList` whose
   * tiles are `items` in the same order, which is how each poster in the
   * stack knows the tile it flies to.
   */
  children: ReactNode;
  defaultExpanded?: boolean;
  /**
   * Opens the stack whenever this turns true, as `ExpandableSection`'s does —
   * for the editing buttons, which a closed stack would hide. Never closes it.
   */
  expandWhen?: boolean;
}

/** Most posters drawn in the stack, however wide the row. */
const MAX_DRAWN = 30;
/**
 * How much of each poster shows past the one on top of it. Fixed, so the pile
 * is as dense on a phone as on a laptop: a wider row draws more posters, not
 * the same posters spread out, and a narrow one fewer rather than a crush.
 */
const STEP_RATIO = 0.42;
/** The caption beside the posters, on a row wide enough for it. */
const CAPTION_WIDTH = 180;
/**
 * The row width the caption moves beside the posters from. Measured on the
 * stack itself rather than a media query, so the posters it lays out and the
 * room it leaves agree.
 */
const WIDE_FROM = 720;
/** The row width the posters grow to the size of a tile's from. */
const LARGE_FROM = 1000;
/** The stack's padding, each side, as its stylesheet sets. */
const PADDING = 20;
/** A little untidy, as a pile of posters is. Degrees, repeating. */
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, 2.5, -2.5];

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const FLY_DURATION = 520;
const FLY_STAGGER = 18;
/** The rest of the list fades in behind the posters that fly. */
const FADE_DURATION = 360;
const FADE_STAGGER = 10;
/** Tiles past this are below the fold on any screen: not worth animating. */
const MAX_FADED = 48;

/**
 * Moves an element from where `from` is to where it now sits: the caption
 * becoming the toggle, and back. Moved rather than scaled, since the two are
 * laid out differently and text stretched between them reads as a glitch.
 */
function flyFrom(element: HTMLElement, from: { left: number; top: number }) {
  const to = element.getBoundingClientRect();
  const transform = `translate(${from.left - to.left}px, ${from.top - to.top}px)`;
  element.animate([{ transform }, { transform: "none" }], {
    duration: FLY_DURATION,
    easing: EASE,
  });
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The tile's artwork: the poster (or the outline a removed film leaves), which
 * is what a poster in the stack turns into. A tile is a link holding the
 * poster first, or, unlinked, the poster itself first.
 */
function getTileArt(tile: Element): Element {
  const first = tile.firstElementChild;
  if (!first) return tile;
  return first.tagName === "A" ? (first.firstElementChild ?? first) : first;
}

/** The list's tiles, in order. */
function getTiles(list: HTMLElement | null): HTMLElement[] {
  const grid = list?.querySelector("ul");
  return grid ? (Array.from(grid.children) as HTMLElement[]) : [];
}

/**
 * The transform that draws an element, scaled about its own centre, so that
 * the part of it at `part` lands on `target` instead. Everything is in
 * viewport coordinates, measured untransformed.
 */
function getFlipTransform(
  element: DOMRect,
  part: DOMRect,
  target: { left: number; top: number; width: number },
) {
  const scale = target.width / part.width;
  const originX = element.left + element.width / 2;
  const originY = element.top + element.height / 2;
  const x = target.left - originX - scale * (part.left - originX);
  const y = target.top - originY - scale * (part.top - originY);
  return `translate(${x}px, ${y}px) scale(${scale})`;
}

/**
 * A long list of films drawn as a pile of posters, the whole of it one button
 * that opens the list in full. Opening it flies each poster in the pile to its
 * place in the list, and closing it flies them back.
 *
 * For a list that is long and not the reason for a visit — a Seen list, the
 * films on a watchlist with no news — where a full grid would push everything
 * after it a few screens down. A list that fits on one row is drawn as it is,
 * since a pile of three posters hides nothing worth hiding. Don't use it for
 * what a reader came to act on: they'd have to open it first.
 *
 * Closed, the stack is a plain button: the posters inside are pictures, not
 * links, and the button carries the name. Open, focus moves to the first tile.
 * The caption flies to the top right as the toggle to close it again, so it
 * is where the stack was opened from, and a second one follows the list for a
 * reader who has scrolled to its end.
 */
export default function PosterStack({
  items,
  label,
  children,
  defaultExpanded = false,
  expandWhen = false,
}: PosterStackProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || expandWhen);
  // Adjusted during render, as in ExpandableSection, so it never paints
  // closed for a frame first. Only the false → true edge acts.
  const [lastExpandWhen, setLastExpandWhen] = useState(expandWhen);
  if (expandWhen !== lastExpandWhen) {
    setLastExpandWhen(expandWhen);
    if (expandWhen) setExpanded(true);
  }

  const [measureRef, width] = useElementWidth<HTMLDivElement>();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const postersRef = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  // Before the row is measured, six across: the 960px column's count.
  const columns = width ? getTileColumnCount(width) : 6;
  if (items.length <= columns) {
    return (
      <div ref={measureRef} className={styles.root}>
        {children}
      </div>
    );
  }

  const rowWidth = width ?? 960;
  const wide = rowWidth >= WIDE_FROM;
  const posterWidth = rowWidth >= LARGE_FROM ? 128 : wide ? 112 : 84;
  const available = Math.max(
    posterWidth,
    rowWidth - PADDING * 2 - (wide ? CAPTION_WIDTH : 0),
  );
  const step = posterWidth * STEP_RATIO;
  const fits = Math.floor((available - posterWidth) / step) + 1;
  const drawnCount = Math.max(1, Math.min(items.length, MAX_DRAWN, fits));
  const drawn = items.slice(0, drawnCount);

  /** Where each poster in the stack sits, untransformed. */
  const getPosterRects = () => {
    const posters = postersRef.current;
    if (!posters) return [];
    const box = posters.getBoundingClientRect();
    return (Array.from(posters.children) as HTMLElement[])
      .filter((poster) => poster.dataset.index !== undefined)
      .map(
        (poster) =>
          new DOMRect(
            box.left + poster.offsetLeft,
            box.top + poster.offsetTop,
            poster.offsetWidth,
            poster.offsetHeight,
          ),
      );
  };

  const expand = () => {
    const from = getPosterRects();
    const caption = captionRef.current?.getBoundingClientRect();
    flushSync(() => setExpanded(true));
    const tiles = getTiles(listRef.current);

    if (!prefersReducedMotion()) {
      // The caption becomes the toggle to close it again, at the top right.
      const toggle = toggleRef.current;
      if (caption && toggle) flyFrom(toggle, caption);

      tiles.forEach((tile, index) => {
        const start = from[index];
        if (start) {
          const transform = getFlipTransform(
            tile.getBoundingClientRect(),
            getTileArt(tile).getBoundingClientRect(),
            start,
          );
          // Above the tiles fading in, and the first poster above the rest,
          // as it was in the stack.
          tile.style.zIndex = String(from.length - index + 1);
          tile
            .animate([{ transform }, { transform: "none" }], {
              duration: FLY_DURATION,
              easing: EASE,
              delay: index * FLY_STAGGER,
              fill: "backwards",
            })
            .finished.then(
              () => tile.style.removeProperty("z-index"),
              () => tile.style.removeProperty("z-index"),
            );
        } else if (index < from.length + MAX_FADED) {
          tile.animate(
            [
              { opacity: 0, transform: "translateY(16px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: FADE_DURATION,
              easing: EASE,
              delay:
                from.length * FLY_STAGGER +
                (index - from.length) * FADE_STAGGER,
              fill: "backwards",
            },
          );
        }
      });
    }

    // On to the list, so a keyboard reader carries on from where the button
    // was rather than from the top of the page.
    const first = listRef.current?.querySelector<HTMLElement>("a, button");
    (first ?? listRef.current)?.focus({ preventScroll: true });
  };

  const collapse = () => {
    const from = getTiles(listRef.current)
      .slice(0, drawnCount)
      .map((tile) => getTileArt(tile).getBoundingClientRect());
    const toggle = toggleRef.current?.getBoundingClientRect();
    // The window the stack is drawn in, which in the profile preview is an
    // iframe's rather than the page's.
    const view = rootRef.current?.ownerDocument.defaultView ?? window;
    const scrollBefore = view.scrollY;
    flushSync(() => setExpanded(false));

    // Closing a long list from the button under it can leave the stack above
    // the screen. It is brought back into view, and the posters fly from
    // where their tiles were.
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) {
      root.scrollIntoView({ block: "start" });
    }
    const scrolled = view.scrollY - scrollBefore;

    if (!prefersReducedMotion()) {
      const posters = postersRef.current
        ? (Array.from(postersRef.current.children) as HTMLElement[]).filter(
            (poster) => poster.dataset.index !== undefined,
          )
        : [];
      const to = getPosterRects();
      const caption = captionRef.current;
      if (toggle && caption) {
        flyFrom(caption, {
          left: toggle.left,
          top: toggle.top - scrolled,
        });
      }
      posters.forEach((poster, index) => {
        const start = from[index];
        if (!start || !to[index]) return;
        const transform = getFlipTransform(to[index], to[index], {
          left: start.left,
          top: start.top - scrolled,
          width: start.width,
        });
        poster.animate(
          [
            { transform, rotate: "0deg" },
            { transform: "none", rotate: getComputedStyle(poster).rotate },
          ],
          {
            duration: FLY_DURATION,
            easing: EASE,
            delay: (drawnCount - 1 - index) * FLY_STAGGER,
            fill: "backwards",
          },
        );
      });
    }

    buttonRef.current?.focus({ preventScroll: true });
  };

  const count = `${items.length.toLocaleString("en-GB")} films`;

  const collapseLabel = `${label}: hide all ${count}`;

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        measureRef(node);
      }}
      className={styles.root}
    >
      {expanded ? (
        <>
          <div className={styles.header}>
            <button
              ref={toggleRef}
              type="button"
              className={styles.toggle}
              onClick={collapse}
              aria-expanded
              aria-controls={listId}
              aria-label={collapseLabel}
            >
              <strong className={styles.toggleCount}>{count}</strong>
              <span className={styles.toggleAction}>
                Hide them
                <ChevronDownIcon size={14} />
              </span>
            </button>
          </div>
          <div
            id={listId}
            ref={listRef}
            className={styles.list}
            tabIndex={-1}
            aria-label={`${label}, ${count}`}
            role="region"
          >
            {children}
          </div>
          <div className={styles.collapse}>
            <Button
              variant="secondary"
              size="sm"
              onClick={collapse}
              aria-expanded
              aria-controls={listId}
              aria-label={collapseLabel}
            >
              Hide them
            </Button>
          </div>
        </>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          className={clsx(styles.stack, wide && styles.stackWide)}
          onClick={expand}
          aria-expanded={false}
          aria-label={`${label}: show all ${count}`}
        >
          <span
            ref={postersRef}
            className={styles.posters}
            aria-hidden="true"
            style={
              {
                width: posterWidth + step * (drawnCount - 1),
                "--poster-width": `${posterWidth}px`,
              } as CSSProperties
            }
          >
            {drawn.map((item, index) => (
              <span
                key={item.id}
                data-index={index}
                className={styles.poster}
                style={
                  {
                    left: index * step,
                    zIndex: drawnCount - index,
                    "--rotate": `${ROTATIONS[index % ROTATIONS.length]}deg`,
                  } as CSSProperties
                }
              >
                <EventPoster
                  title={item.title}
                  posterPath={item.posterPath}
                  includedMovies={item.includedMovies}
                  // As the tiles draw it, so a poster doesn't change look as it
                  // flies into one.
                  size="xsmall"
                  interactive={false}
                />
              </span>
            ))}
            <span className={styles.prompt}>
              <span className={styles.promptPointer}>Click to expand</span>
              <span className={styles.promptTouch}>Tap to expand</span>
            </span>
          </span>
          <span ref={captionRef} className={styles.caption} aria-hidden="true">
            <strong className={styles.count}>{count}</strong>
            <span className={styles.seeAll}>
              See them all
              <ChevronDownIcon size={14} />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

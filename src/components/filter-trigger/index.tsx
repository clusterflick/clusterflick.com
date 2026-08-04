"use client";

import { useMemo, useRef, useEffect } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@/components/icons";
import {
  useFilterConfig,
  EVENT_CATEGORIES,
} from "@/state/filter-config-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { describeFilters } from "@/lib/filters";
import styles from "./filter-trigger.module.css";

interface FilterTriggerProps {
  onClick: () => void;
  isOverlayOpen: boolean;
  onTextHeightChange?: (height: number) => void;
}

export default function FilterTrigger({
  onClick,
  isOverlayOpen,
  onTextHeightChange,
}: FilterTriggerProps) {
  const { filterState } = useFilterConfig();
  const { metaData } = useCinemaData();
  const textWrapperRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const flashedState = useRef<typeof filterState | null>(null);

  // Compute cinema venue IDs
  const cinemaVenueIds = useMemo(() => {
    if (!metaData?.venues) return [];
    return Object.values(metaData.venues)
      .filter((v) => v.type === "Cinema")
      .map((v) => v.id);
  }, [metaData]);

  // Generate filter description
  const description = useMemo(() => {
    return describeFilters({
      state: filterState,
      categories: EVENT_CATEGORIES,
      venues: metaData?.venues || null,
      genres: metaData?.genres || null,
      cinemaVenueIds,
    });
  }, [filterState, metaData, cinemaVenueIds]);

  // Flash the summary whenever a filter changes. The wording updates either way,
  // but a line of text quietly rewriting itself is easy to miss — especially
  // from the far side of the overlay, where the chip you just tapped is nowhere
  // near the summary. A glow that cools off over the next second draws the eye
  // up to read what it now says.
  //
  // Keyed on the filter state rather than the description text: the description
  // also changes when venue metadata finishes loading, which is not something
  // anyone did and shouldn't announce itself.
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Flash on a genuine change of value, not on "this effect has run before".
    // Under StrictMode, React deliberately runs mount effects twice while refs
    // survive in between, so a first-run boolean guard reports the second pass
    // as a change and flashes on page load. Comparing the state itself is
    // immune to that: the two mount passes carry the same object, and a
    // remount (routing back to a filtered page) resets this to null.
    const previous = flashedState.current;
    flashedState.current = filterState;
    if (previous === null || previous === filterState) return;

    element.classList.remove(styles.changed);
    // Reading a layout property forces the class removal to take effect now, so
    // re-adding it restarts the animation instead of being coalesced away.
    void element.offsetWidth;
    element.classList.add(styles.changed);
  }, [filterState]);

  // Measure text wrapper height and report it continuously during animation
  useEffect(() => {
    if (!textWrapperRef.current || !onTextHeightChange) {
      return;
    }

    if (!isOverlayOpen) {
      // Reset to 0 when closed
      onTextHeightChange(0);
      return;
    }

    const element = textWrapperRef.current;

    // Use ResizeObserver for continuous updates during animation
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onTextHeightChange(entry.contentRect.height);
      }
    });

    resizeObserver.observe(element);

    // Initial measurement
    onTextHeightChange(element.getBoundingClientRect().height);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOverlayOpen, description, onTextHeightChange]);

  return (
    <button
      className={clsx(styles.trigger, isOverlayOpen && styles.open)}
      onClick={onClick}
      aria-label={
        isOverlayOpen ? "Close filter options" : "Open filter options"
      }
    >
      <span className={styles.textWrapper} ref={textWrapperRef}>
        <span className={styles.text} ref={textRef}>
          <span className={styles.highlight}>{description.events}</span>
          {" • "}
          <span className={styles.highlight}>{description.venues}</span>
          {" • "}
          <span className={styles.highlight}>{description.dates}</span>
        </span>
        <ChevronDownIcon className={styles.chevron} />
      </span>
    </button>
  );
}

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
        <span className={styles.text}>
          <span className={styles.highlight}>
            {metaData
              ? description.events
              : "Films, Multiple Films & Short Films"}
          </span>
          {" • "}
          <span className={styles.highlight}>
            {metaData ? description.venues : "At all venues"}
          </span>
          {" • "}
          <span className={styles.highlight}>
            {metaData ? description.dates : "Showing in Next 7 Days"}
          </span>
        </span>
        <ChevronDownIcon className={styles.chevron} />
      </span>
    </button>
  );
}

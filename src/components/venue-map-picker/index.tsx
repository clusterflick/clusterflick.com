"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Button from "@/components/button";
import { CloseIcon } from "@/components/icons";
import type { VenueMapPickerVenue } from "./leaflet-venue-map-picker";
import styles from "./venue-map-picker.module.css";

// Leaflet touches `window` at import time, so the map is loaded only on the
// client — and only once someone opens the picker, keeping it off every page
// that merely carries the filter overlay.
const LeafletVenueMapPicker = dynamic(
  () => import("./leaflet-venue-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.skeleton} aria-hidden="true">
        <span className={styles.skeletonLabel}>Loading map…</span>
      </div>
    ),
  },
);

export type VenueMapPickerItem = VenueMapPickerVenue;

interface VenueMapPickerProps {
  /** Every selectable venue, with its position and current film count. */
  venues: VenueMapPickerItem[];
  /** The selection to start from: `null` means every venue. */
  selectedVenues: string[] | null;
  /**
   * Commit the edited selection. Called with `null` when every venue ended up
   * selected, matching the filter's own "no restriction" value.
   */
  onApply: (venueIds: string[] | null) => void;
  /** Leave without changing anything. */
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function formatVenueCount(count: number): string {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? "venue" : "venues"}`;
}

/**
 * A full-screen map for choosing which venues the filter includes.
 *
 * It edits a draft and commits a snapshot of venue ids on Apply, so the result
 * is the same `string[]` the rest of the filter already reads, and panning
 * around never re-runs the films grid underneath. An area is picked by framing
 * it — "Only these" makes what is on screen the selection — and single pins
 * toggle on tap.
 */
export default function VenueMapPicker({
  venues,
  selectedVenues,
  onApply,
  onClose,
}: VenueMapPickerProps) {
  const [draft, setDraft] = useState<ReadonlySet<string>>(
    () => new Set(selectedVenues ?? venues.map((venue) => venue.id)),
  );
  const [inView, setInView] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const venueNames = useMemo(
    () => new Map(venues.map((venue) => [venue.id, venue.name])),
    [venues],
  );

  const toggleVenue = useCallback(
    (venueId: string) => {
      setDraft((current) => {
        const next = new Set(current);
        const removing = next.has(venueId);
        if (removing) next.delete(venueId);
        else next.add(venueId);
        // A tap on a pin changes nothing a screen reader, or a thumb covering
        // the pin, can see; say what happened.
        setAnnouncement(
          `${removing ? "Removed" : "Added"} ${venueNames.get(venueId) ?? "venue"}`,
        );
        return next;
      });
    },
    [venueNames],
  );

  const replaceDraft = useCallback((next: Set<string>, message: string) => {
    setDraft(next);
    setAnnouncement(message);
  }, []);

  const selectedInView = inView.filter((id) => draft.has(id)).length;
  const draftIsInView =
    draft.size === inView.length && selectedInView === inView.length;

  const selectOnlyInView = () =>
    replaceDraft(
      new Set(inView),
      `Selected only the ${formatVenueCount(inView.length)} in view`,
    );
  const addInView = () =>
    replaceDraft(
      new Set([...draft, ...inView]),
      `Added ${formatVenueCount(inView.length - selectedInView)} in view`,
    );
  const removeInView = () => {
    const visible = new Set(inView);
    replaceDraft(
      new Set([...draft].filter((id) => !visible.has(id))),
      `Removed ${formatVenueCount(selectedInView)} in view`,
    );
  };

  const apply = () => {
    // Keep the venues' own order, so the same selection always serialises to
    // the same URL whichever order it was built up in.
    const ids = venues.map((venue) => venue.id).filter((id) => draft.has(id));
    onApply(ids.length === venues.length ? null : ids);
  };

  // This sits over the filter overlay, which closes itself on Escape from a
  // document listener. Catch Escape first, in the capture phase, so it closes
  // only the picker and leaves the reader in the overlay they came from.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  // Hand focus back to whatever opened the picker when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => opener?.focus();
  }, []);

  // Portalled to the body: the filter overlay's backdrop-filter makes it the
  // containing block for fixed descendants, which would pin this to the
  // overlay's scrolled content rather than the viewport.
  return createPortal(
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-map-picker-title"
      tabIndex={-1}
    >
      <div className={styles.header}>
        <div>
          <h2 id="venue-map-picker-title" className={styles.title}>
            Choose venues
          </h2>
          <p className={styles.summary}>
            {formatVenueCount(draft.size)} selected of{" "}
            {venues.length.toLocaleString("en-GB")}
          </p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close without applying"
        >
          <CloseIcon size={24} />
        </button>
      </div>

      <div className={styles.mapArea}>
        <LeafletVenueMapPicker
          venues={venues}
          selected={draft}
          onToggle={toggleVenue}
          onInViewChange={setInView}
        />
      </div>

      <div className={styles.inView}>
        <p className={styles.inViewLabel}>
          In view:{" "}
          <strong>
            {formatVenueCount(inView.length)}
            {inView.length > 0 && `, ${selectedInView} selected`}
          </strong>
        </p>
        <div className={styles.inViewActions}>
          <Button
            variant="secondary"
            size="sm"
            onClick={selectOnlyInView}
            disabled={inView.length === 0 || draftIsInView}
          >
            Only these
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={addInView}
            disabled={selectedInView === inView.length}
          >
            Add these
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={removeInView}
            disabled={selectedInView === 0}
          >
            Remove these
          </Button>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLinks}>
          <Button
            variant="link"
            onClick={() =>
              replaceDraft(
                new Set(venues.map((venue) => venue.id)),
                "Selected every venue",
              )
            }
            disabled={draft.size === venues.length}
          >
            Select All
          </Button>
          <span className={styles.divider} aria-hidden="true">
            /
          </span>
          <Button
            variant="link"
            onClick={() => replaceDraft(new Set(), "Cleared the selection")}
            disabled={draft.size === 0}
          >
            Clear All
          </Button>
        </div>
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {/* Nothing selected would empty the grid, which reads as a broken
              filter rather than a choice — so there is nothing to apply. */}
          <Button variant="primary" onClick={apply} disabled={draft.size === 0}>
            Apply
          </Button>
        </div>
      </div>

      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        {announcement}
      </p>
    </div>,
    document.body,
  );
}

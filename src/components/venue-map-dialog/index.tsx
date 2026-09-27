"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import VenueMap, { type VenueMapVenue } from "@/components/venue-map";
import { CloseIcon } from "@/components/icons";
import styles from "./venue-map-dialog.module.css";

export type VenueMapDialogVenue = VenueMapVenue;

interface VenueMapDialogProps {
  /** Toolbar title, e.g. "Where it's playing". */
  title: string;
  /** A line under the title, e.g. "Showing at 12 venues". */
  summary?: string;
  venues: VenueMapDialogVenue[];
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * `VenueMap` full screen, over the page, for seeing where a set of venues
 * sits across London. Read-only: pins open a popup linking to the venue.
 */
export default function VenueMapDialog({
  title,
  summary,
  venues,
  onClose,
}: VenueMapDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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

  // Hand focus back to whatever opened the dialog when it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => opener?.focus();
  }, []);

  // The page would otherwise scroll behind the map on a phone.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className={styles.header}>
        <div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {summary && <p className={styles.summary}>{summary}</p>}
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close map"
        >
          <CloseIcon size={24} />
        </button>
      </div>
      <div className={styles.mapArea}>
        <VenueMap venues={venues} fill />
      </div>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LoadingIndicator from "@/components/loading-indicator";
import { useUserContext } from "@/state/user-context";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import {
  PROFILE_SECTION_IDS,
  type FavouriteFilm,
  type ProfileLinks,
  type ProfileSections,
} from "@/lib/user-profile";
import type { MovieListProgressItem } from "@/app/personalise/seen-stats";
import ProfileHero from "@/app/profile-shell/profile-hero";
import ProfileView from "@/app/profile-shell/profile-view";
import NothingShared from "@/app/profile-shell/nothing-shared";
import styles from "./page.module.css";

export type PreviewProfile = {
  handle: string;
  displayName?: string;
  links: ProfileLinks;
  favourites: FavouriteFilm[];
  sections: ProfileSections;
};

type BuildData = {
  venueImagePaths: Record<string, string>;
  movieLists: MovieListProgressItem[];
};

/**
 * The profile as a visitor will see it, from the draft as it stands, saved
 * or not: the profile page's own hero and sections, given the reader's own
 * lists. Their film details are read once, as /personalise reads them.
 */
export function ProfilePreview({
  profile,
  venueImagePaths,
  movieLists,
}: { profile: PreviewProfile } & BuildData) {
  const { lists, favouriteVenues, readFilmDetails } = useUserContext();
  const [filmDetails, setFilmDetails] = useState<FilmDetailsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    readFilmDetails().then(
      (details) => !cancelled && setFilmDetails(details),
      (error) => {
        console.error("Failed to load film details", error);
        // The stats then say there's nothing to count, as they would on the
        // page for a reader with no details.
        if (!cancelled) setFilmDetails({ films: {}, people: {} });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [readFilmDetails]);

  if (!lists || !filmDetails) {
    return <LoadingIndicator message="Loading the preview…" />;
  }

  const ownerName = profile.displayName ?? profile.handle;
  const nothingShown = PROFILE_SECTION_IDS.every((id) => !profile.sections[id]);

  return (
    <>
      <ProfileHero
        handle={profile.handle}
        displayName={profile.displayName}
        links={profile.links}
        favourites={profile.favourites}
        sections={profile.sections}
        lists={lists}
        filmDetails={filmDetails}
        inPreview
      />
      {nothingShown ? (
        <div className={styles.previewEmpty}>
          <NothingShared ownerName={ownerName} />
        </div>
      ) : (
        <ProfileView
          ownerName={ownerName}
          sections={profile.sections}
          lists={lists}
          favouriteVenues={favouriteVenues ?? {}}
          filmDetails={filmDetails}
          venueImagePaths={venueImagePaths}
          movieLists={movieLists}
        />
      )}
    </>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The preview, full screen, where the screen is too narrow to show it beside
 * the settings. Opened from the save bar. Focus stays inside while it's open
 * and goes back to the button that opened it, as the venue map's dialog does.
 */
export function PreviewDialog({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => opener?.focus();
  }, []);

  // The page would otherwise scroll behind the preview.
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
      className={styles.previewDialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className={styles.previewDialogBar}>
        <h2 id={titleId} className={styles.previewDialogTitle}>
          Preview
        </h2>
        <button
          type="button"
          className={styles.previewDialogClose}
          onClick={onClose}
        >
          Back to settings
        </button>
      </div>
      <div className={styles.previewDialogBody}>{children}</div>
    </div>,
    document.body,
  );
}

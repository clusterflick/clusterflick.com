"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Venue } from "@/types";
import { StarIcon } from "@/components/icons";
import { useUserContext } from "@/state/user-context";
import styles from "./favourite-venue-button.module.css";

const LABEL = "My venue";
const HINT = "Add to My Venues, a one-tap venue filter on the films grid";

interface FavouriteVenueButtonProps {
  /** What a favourite keeps about the venue — see `FavouriteVenueEntry`. */
  venue: Pick<Venue, "id" | "name">;
}

/**
 * Toggles a venue in and out of the reader's "My Venues", the set behind the
 * filter overlay's My Venues pill. The venue page's counterpart to
 * `UserListButtons`, and it behaves the same way: a link to `/personalise`
 * until signed in, a toggle after, the same label either way so the static
 * HTML doesn't move, and nothing at all without a Firebase config.
 */
export default function FavouriteVenueButton({
  venue,
}: FavouriteVenueButtonProps) {
  const { status, favouriteVenues, addFavouriteVenue, removeFavouriteVenue } =
    useUserContext();
  const [error, setError] = useState(false);

  if (status === "unavailable") return null;

  if (status !== "signed-in") {
    return (
      <div className={styles.wrapper}>
        <Link href="/personalise" className={styles.button} title={HINT}>
          <StarIcon size={16} />
          {LABEL}
        </Link>
      </div>
    );
  }

  const isOn = !!favouriteVenues?.[venue.id];

  const toggle = async () => {
    setError(false);
    try {
      if (isOn) {
        await removeFavouriteVenue(venue.id);
      } else {
        await addFavouriteVenue(venue);
      }
    } catch (caught) {
      console.error("Failed to update My Venues", caught);
      setError(true);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        aria-pressed={isOn}
        // Still loading: the state isn't known, so neither is what a press
        // would do.
        disabled={!favouriteVenues}
        onClick={toggle}
        className={clsx(styles.button, isOn && styles.on)}
        title={isOn ? undefined : HINT}
      >
        <StarIcon size={16} filled={isOn} />
        {LABEL}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          That didn&apos;t save. Please try again.
        </p>
      )}
    </div>
  );
}

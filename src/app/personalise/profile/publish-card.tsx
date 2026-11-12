"use client";

import { useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import Button, { ButtonAnchor } from "@/components/button";
import ReleaseDot from "@/components/release-dot";
import {
  getProfileDisplayAddress,
  getProfilePath,
  ProfileSectionId,
  type UserProfile,
} from "@/lib/user-profile";
import CopyLinkButton, {
  getProfileUrl,
} from "@/app/profile-shell/copy-link-button";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

/** Whether the browser can share doesn't change while the page is open. */
const noSubscription = () => () => {};

/** What each section is called, as its switch is labelled. */
export const SECTION_NAMES: Record<ProfileSectionId, string> = {
  [ProfileSectionId.SeenStats]: "Seen stats",
  [ProfileSectionId.Watchlist]: "Watchlist",
  [ProfileSectionId.FavouriteVenues]: "Favourite venues",
  [ProfileSectionId.Seen]: "Seen list",
};

/**
 * Where the profile stands, at the top of the settings: private with the way
 * to publish it, or public with its address, the means to share it, and the
 * way to take it down.
 *
 * Publishing is one press: the switches and the preview beside them are
 * where the reader considers what they're sharing, and taking it down again
 * is one press too. It saves the draft with it, in one write, so what goes
 * public is what the preview shows; only a new address with it asks first,
 * since freeing the old one can't be undone. Then the card lights up, with
 * the address to copy or share. With unsaved changes the button reads "Save
 * and publish", since it saves them too. A green dot says it's public, a pink one
 * that it's private.
 */
export default function PublishCard({
  profile,
  canPublish,
  publishBlocker,
  changed,
  renameFrom,
  saving,
  error,
  onPublish,
  onUnpublish,
}: {
  profile: UserProfile | null;
  canPublish: boolean;
  /** Why publishing can't happen yet, when it can't. */
  publishBlocker?: string;
  /**
   * The draft has unsaved changes. Publishing saves them with it, so the
   * button says so.
   */
  changed: boolean;
  /** The saved handle a publish would rename away from, if any. */
  renameFrom?: string;
  saving: boolean;
  error: string | null;
  onPublish: () => Promise<boolean>;
  onUnpublish: () => Promise<boolean>;
}) {
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const isPublic = profile?.public ?? false;

  // Only known in the browser: false in the static HTML, then the truth.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  const publish = async () => {
    if (await onPublish()) {
      setConfirmingRename(false);
      setJustPublished(true);
    }
  };

  const share = async (handle: string) => {
    try {
      await navigator.share({
        title: "My films on Clusterflick",
        url: getProfileUrl(handle),
      });
    } catch (shareError) {
      // Closing the share sheet is a rejection too, and not a failure.
      if ((shareError as Error).name !== "AbortError") {
        console.error("Failed to share the profile", shareError);
      }
    }
  };

  if (isPublic && profile) {
    const address = getProfileDisplayAddress(profile.handle);
    return (
      <section
        className={clsx(
          personaliseStyles.card,
          styles.card,
          styles.publishCard,
          styles.live,
          justPublished && styles.justPublished,
        )}
        aria-live="polite"
      >
        <h2 className={styles.cardTitle}>
          <ReleaseDot />
          {justPublished ? "You're live" : "Your profile is public"}
        </h2>
        <p className={styles.liveAddress}>{address}</p>
        <p className={personaliseStyles.managementText}>
          {justPublished
            ? "Anyone with the link can see it now. Send it to someone you'd go to the cinema with."
            : "Anyone with the link can see it, and search engines may list it."}
        </p>
        <div className={personaliseStyles.managementActions}>
          {/* An anchor, not a client-side link: the page is the profiles
              Worker's, and isn't in the static export. */}
          <ButtonAnchor href={getProfilePath(profile.handle)} size="sm">
            View your profile
          </ButtonAnchor>
          <CopyLinkButton handle={profile.handle} />
          {canShare && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => share(profile.handle)}
            >
              Share
            </Button>
          )}
          <Button
            variant="link"
            onClick={async () => {
              if (await onUnpublish()) setJustPublished(false);
            }}
            disabled={saving}
          >
            Make it private
          </Button>
        </div>
        {error && (
          <p className={personaliseStyles.error} role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className={clsx(personaliseStyles.card, styles.card, styles.publishCard)}
    >
      <h2 className={styles.cardTitle}>
        <ReleaseDot off />
        {profile ? "Your profile is private" : "Your public profile"}
      </h2>
      {!confirmingRename ? (
        <>
          <p className={personaliseStyles.managementText}>
            {profile
              ? "Nobody else can see it until you publish it. The preview shows how it will look."
              : "Choose your handle and what your profile shows. Nobody else can see it until you publish it."}
          </p>
          {/* What stops it, in place of a button that can't be pressed. */}
          {publishBlocker ? (
            <p className={styles.publishBlocker}>{publishBlocker}</p>
          ) : (
            <div className={personaliseStyles.managementActions}>
              <Button
                size="sm"
                onClick={() =>
                  renameFrom ? setConfirmingRename(true) : publish()
                }
                disabled={!canPublish || saving}
              >
                {saving
                  ? "Publishing…"
                  : changed
                    ? "Save and publish"
                    : "Publish profile"}
              </Button>
            </div>
          )}
        </>
      ) : (
        // Publishing saves the draft, so a new address with it frees the old
        // one, which is the one thing here that can't be taken back.
        <>
          <p className={personaliseStyles.managementText}>
            Publishing saves your new address too, so{" "}
            {getProfileDisplayAddress(renameFrom!)} will stop working straight
            away, and anyone can claim it.
          </p>
          <div className={personaliseStyles.managementActions}>
            <Button size="sm" onClick={publish} disabled={saving}>
              {saving ? "Publishing…" : "Change it and publish"}
            </Button>
            <Button variant="link" onClick={() => setConfirmingRename(false)}>
              Cancel
            </Button>
          </div>
        </>
      )}
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

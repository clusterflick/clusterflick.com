"use client";

import { useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import Button, { ButtonAnchor } from "@/components/button";
import {
  getProfilePath,
  PROFILE_SECTION_IDS,
  ProfileSectionId,
  type ProfileSections,
  type UserProfile,
} from "@/lib/user-profile";
import CopyLinkButton, {
  getProfileUrl,
} from "@/app/profile-shell/copy-link-button";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

/** Whether the browser can share doesn't change while the page is open. */
const noSubscription = () => () => {};

/** What each section is called, where the reader is told what goes public. */
export const SECTION_NAMES: Record<ProfileSectionId, string> = {
  [ProfileSectionId.SeenStats]: "Seen stats",
  [ProfileSectionId.Watchlist]: "Watchlist",
  [ProfileSectionId.FavouriteVenues]: "Favourite venues",
  [ProfileSectionId.Seen]: "Seen list",
};

const formatList = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Where the profile stands, at the top of the settings: private with the way
 * to publish it, or public with its address, the means to share it, and the
 * way to take it down.
 *
 * Publishing is a moment, not a switch. It first says what's about to go
 * public, section by section, which is where the reader considers what
 * they're sharing; the rules make the same point by refusing a public
 * profile that hasn't chosen its sections. Publishing saves the draft with
 * it, in one write, so what goes public is what the preview shows. Then the
 * card says so, with the address to copy or share. Taking it down never waits
 * for anything.
 */
export default function PublishCard({
  profile,
  draftSections,
  hasFavourites,
  canPublish,
  publishBlocker,
  renameFrom,
  saving,
  error,
  onPublish,
  onUnpublish,
}: {
  profile: UserProfile | null;
  /** The sections as the draft has them: what publishing would show. */
  draftSections: ProfileSections;
  hasFavourites: boolean;
  canPublish: boolean;
  /** Why publishing can't happen yet, when it can't. */
  publishBlocker?: string;
  /** The saved handle a publish would rename away from, if any. */
  renameFrom?: string;
  saving: boolean;
  error: string | null;
  onPublish: () => Promise<boolean>;
  onUnpublish: () => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  const isPublic = profile?.public ?? false;

  // Only known in the browser: false in the static HTML, then the truth.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  const shown = PROFILE_SECTION_IDS.filter((id) => draftSections[id]).map(
    (id) => SECTION_NAMES[id],
  );
  const hidden = PROFILE_SECTION_IDS.filter((id) => !draftSections[id]).map(
    (id) => SECTION_NAMES[id],
  );

  const publish = async () => {
    if (await onPublish()) {
      setConfirming(false);
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
    const address = `clusterflick.com${getProfilePath(profile.handle)}`;
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
        {profile ? "Your profile is private" : "Your public profile"}
      </h2>
      {!confirming ? (
        <>
          <p className={personaliseStyles.managementText}>
            {profile
              ? `Only you can open clusterflick.com${getProfilePath(profile.handle)}. Publish it when it looks right.`
              : "Choose an address and what your profile shows. Nothing is public until you publish it."}
          </p>
          <div className={personaliseStyles.managementActions}>
            <Button
              size="sm"
              onClick={() => setConfirming(true)}
              disabled={!canPublish || saving}
              aria-describedby={
                publishBlocker ? "profile-publish-blocker" : undefined
              }
            >
              Publish profile
            </Button>
            {profile && (
              <ButtonAnchor
                href={getProfilePath(profile.handle)}
                variant="secondary"
                size="sm"
              >
                View it privately
              </ButtonAnchor>
            )}
          </div>
          {publishBlocker && (
            <p
              id="profile-publish-blocker"
              className={personaliseStyles.managementStatus}
            >
              {publishBlocker}
            </p>
          )}
        </>
      ) : (
        <div className={styles.confirm}>
          <p className={styles.confirmLead}>Before it goes public:</p>
          <ul className={styles.confirmList}>
            <li>
              <strong>Shown:</strong>{" "}
              {formatList([
                ...(hasFavourites ? ["Favourite films"] : []),
                ...shown,
              ]) || "only your name and links"}
            </li>
            {hidden.length > 0 && (
              <li>
                <strong>Hidden:</strong> {formatList(hidden)}
              </li>
            )}
            {draftSections[ProfileSectionId.SeenStats] &&
              !draftSections[ProfileSectionId.Seen] && (
                <li>
                  Your stats are worked out from your Seen list in the
                  visitor&apos;s browser, so the list is sent with the page
                  though it isn&apos;t shown.
                </li>
              )}
            {renameFrom && (
              <li>
                clusterflick.com{getProfilePath(renameFrom)} will stop working,
                and anyone can claim it.
              </li>
            )}
          </ul>
          <div className={personaliseStyles.managementActions}>
            <Button size="sm" onClick={publish} disabled={saving}>
              {saving ? "Publishing…" : "Publish"}
            </Button>
            <Button variant="link" onClick={() => setConfirming(false)}>
              Not yet
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

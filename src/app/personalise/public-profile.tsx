"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import Button, { ButtonAnchor, ButtonLink } from "@/components/button";
import ReleaseDot from "@/components/release-dot";
import MoviePoster from "@/components/movie-poster";
import { useUserContext } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  getProfilePath,
  getShownSections,
  PROFILE_SECTION_IDS,
  type UserProfile,
} from "@/lib/user-profile";
import CopyLinkButton, {
  getProfileUrl,
} from "@/app/profile-shell/copy-link-button";
import { PROFILE_SETTINGS_PATH } from "./profile/path";
import { SECTION_NAMES } from "./profile/publish-card";
import OnOffItem from "./on-off-item";
import styles from "./page.module.css";

export type PublicProfileState = {
  /** Whether the reader has the `publicProfile` capability. */
  granted: boolean;
  /** Null before they claim a handle. */
  profile: UserProfile | null;
  /** Replaces the profile after a save. */
  onSaved: (profile: UserProfile) => void;
};

/**
 * The capability and the profile, read together, for the page to decide what
 * to offer. Null until both are known, and if either can't be read: like the
 * coming-soon panel, a setting nobody can reach is better than a broken page.
 */
export function usePublicProfile(): PublicProfileState | null {
  const { status, readCapabilities, readProfile } = useUserContext();
  const signedIn = status === "signed-in";
  const [state, setState] = useState<{
    granted: boolean;
    profile: UserProfile | null;
  } | null>(null);

  // Only once signed in: the settings page asks before Firebase has said who
  // is, and reading then fails.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([readCapabilities(), readProfile()]).then(
      ([capabilities, profile]) => {
        if (cancelled) return;
        setState({
          granted: CapabilityId.PublicProfile in capabilities,
          profile,
        });
      },
      (error) => console.error("Failed to load public profile", error),
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn, readCapabilities, readProfile]);

  const onSaved = useCallback(
    (profile: UserProfile) =>
      setState((current) => current && { ...current, profile }),
    [],
  );

  return state && { ...state, onSaved };
}

/** A refused batch: the rules' answer, here almost always a lost race. */
function isPermissionDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "permission-denied"
  );
}

/**
 * After switching to private, when the cached copy of the profile couldn't be
 * purged. Five minutes is the cache's `FRESH_MS` (clusterflick/api-profiles).
 */
export const PRIVATE_NOT_PURGED =
  "Your profile is private now, but for up to 5 minutes it may still be shown to anyone who had it open or follows a link to it.";

export const SAVE_FAILED =
  "Something went wrong saving that. Please try again.";

/**
 * Saving the profile, for each of its settings: one save at a time, and a
 * refused batch reported as a taken handle when the handle changed, since
 * another reader claiming it between the check and the save is the likely
 * cause. Anything else refused is logged.
 */
export function useProfileSave(
  profile: UserProfile | null,
  onSaved: PublicProfileState["onSaved"],
) {
  const { saveProfile } = useUserContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (next: UserProfile) => {
    setSaving(true);
    setError(null);
    try {
      const { purged } = await saveProfile(next);
      onSaved(next);
      // Saved, but the profile's cached copy couldn't be dropped, so it can
      // still be shown until it expires.
      if (profile?.public && !next.public && !purged) {
        setError(PRIVATE_NOT_PURGED);
      }
      return true;
    } catch (saveError) {
      console.error("Failed to save profile", saveError);
      setError(
        isPermissionDenied(saveError) && next.handle !== profile?.handle
          ? "That handle is taken"
          : SAVE_FAILED,
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { save, saving, setSaving, error, setError };
}

/**
 * Opened from the account bar for a reader with the capability: where their
 * profile stands, its address to copy once it's public, and the way to its
 * settings page, which has the room to preview what each choice shows. Beside
 * it, what the profile shows: the favourites that head it, and each section
 * on or off, so the panel says what's shared without a visit to the settings.
 */
export function PublicProfileSummary({
  profile,
}: Pick<PublicProfileState, "profile">) {
  return (
    <div className={clsx(styles.management, styles.profileManagement)}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Your profile</h3>
        <p className={styles.managementText}>
          {profile && <ReleaseDot off={!profile.public} />}
          {!profile
            ? "Choose an address and what your profile shows. Nobody else can see it until you publish it."
            : profile.public
              ? "Public: anyone with the address can see it."
              : "Private: nobody else can see it until you publish it."}
          {profile?.public && !profile.sections && (
            <>
              {" "}
              It went public before you could choose what it shows, so it shows
              everything: have a look at what&apos;s on it.
            </>
          )}
        </p>
        {/* Only once public: a private profile shows its owner nothing but
            that it's private. */}
        {profile?.public && (
          <div className={styles.assistantAddressRow}>
            <input
              className={clsx(styles.input, styles.assistantAddress)}
              type="text"
              readOnly
              value={getProfileUrl(profile.handle)}
              aria-label="Your profile's address"
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
            <CopyLinkButton handle={profile.handle} variant="primary" />
          </div>
        )}
        <div
          className={clsx(
            styles.managementActions,
            profile?.public && styles.profileActions,
          )}
        >
          <ButtonLink
            href={PROFILE_SETTINGS_PATH}
            size="sm"
            variant={profile?.public ? "secondary" : "primary"}
          >
            {profile ? "Edit profile" : "Set up your profile"}
          </ButtonLink>
          {profile?.public && (
            // An anchor, not a client-side link: the page is the profiles
            // Worker's, and isn't in the static export.
            <ButtonAnchor
              href={getProfilePath(profile.handle)}
              variant="secondary"
              size="sm"
            >
              View your profile
            </ButtonAnchor>
          )}
        </div>
      </section>
      {profile && <ProfileContents profile={profile} />}
    </div>
  );
}

/** The favourites and sections a profile shows, or would once public. */
function ProfileContents({ profile }: { profile: UserProfile }) {
  const sections = getShownSections(profile);
  const favourites = profile.favourites ?? [];
  return (
    <section className={styles.managementSection}>
      <h3 className={styles.managementTitle}>
        {profile.public ? "What it shows" : "What it will show"}
      </h3>
      {favourites.length > 0 && (
        <ol className={styles.profileFavourites} aria-label="Favourite films">
          {favourites.map((film) => (
            <li
              key={film.id}
              className={styles.profileFavourite}
              title={film.year ? `${film.title} (${film.year})` : film.title}
            >
              <MoviePoster
                title={film.title}
                posterPath={film.posterPath}
                showOverlay={!film.posterPath}
                interactive={false}
                fluid
                headingLevel="h3"
              />
            </li>
          ))}
        </ol>
      )}
      <ul className={styles.onOffList} aria-label="Sections">
        {PROFILE_SECTION_IDS.map((id) => (
          <OnOffItem key={id} on={sections[id]} label={SECTION_NAMES[id]} />
        ))}
      </ul>
    </section>
  );
}

/**
 * For a reader whose capability was taken away while their profile was
 * public: it is no longer shown, and they can switch it off for good. The one
 * write the rules allow without the capability.
 */
export function ProfileWithdrawnNotice({
  profile,
  onSaved,
}: {
  profile: UserProfile;
  onSaved: PublicProfileState["onSaved"];
}) {
  const { saveProfile } = useUserContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchOff = async () => {
    setSaving(true);
    setError(null);
    const next = { ...profile, public: false };
    try {
      await saveProfile(next);
      onSaved(next);
    } catch (saveError) {
      console.error("Failed to switch profile off", saveError);
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className={styles.profileNotice} aria-label="Public profile">
      <p className={styles.profileNoticeText}>
        Public profiles are no longer switched on for your account, so your
        profile isn&apos;t shown to anyone. It&apos;s still set to public: you
        can switch it off.
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={switchOff}
        disabled={saving}
      >
        Switch it off
      </Button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}

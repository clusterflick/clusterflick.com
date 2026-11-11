"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import Button from "@/components/button";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  getHandleProblem,
  getProfilePath,
  HANDLE_MAX_LENGTH,
  HANDLE_PROBLEM_MESSAGES,
  type UserProfile,
} from "@/lib/user-profile";
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
  const { readCapabilities, readProfile } = useUserContext();
  const [state, setState] = useState<{
    granted: boolean;
    profile: UserProfile | null;
  } | null>(null);

  useEffect(() => {
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
  }, [readCapabilities, readProfile]);

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

const SAVE_FAILED = "Something went wrong saving that. Please try again.";

/**
 * Opened from the account bar for a reader with the capability: their handle
 * and whether the page is shown. Nothing is public until the switch is on, and
 * the switch can't be turned on before a handle is saved.
 */
export function PublicProfileSettings({
  profile,
  onSaved,
}: Pick<PublicProfileState, "profile" | "onSaved">) {
  const { saveProfile, isHandleTaken } = useUserContext();
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = handle !== (profile?.handle ?? "");
  const problem = changed && handle ? getHandleProblem(handle) : null;

  const save = async (next: UserProfile) => {
    setSaving(true);
    setError(null);
    try {
      await saveProfile(next);
      onSaved(next);
      return true;
    } catch (saveError) {
      console.error("Failed to save profile", saveError);
      // The rules refuse a handle someone else claimed after the check below.
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

  // From the form, or from the rename confirmation beneath it.
  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!changed || !handle || getHandleProblem(handle)) return;
    // Renaming frees the old address at once, so it asks first.
    if (profile && !confirmingRename) {
      setConfirmingRename(true);
      return;
    }
    setConfirmingRename(false);
    setSaving(true);
    setError(null);
    try {
      if (await isHandleTaken(handle)) {
        setError("That handle is taken");
        return;
      }
    } catch (checkError) {
      console.error("Failed to check handle", checkError);
      setError(SAVE_FAILED);
      return;
    } finally {
      setSaving(false);
    }
    await save({ handle, public: profile?.public ?? false });
  };

  const message = problem ? HANDLE_PROBLEM_MESSAGES[problem] : error;

  return (
    <div className={clsx(styles.management, styles.profileManagement)}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Your handle</h3>
        <p id="public-profile-handle-help" className={styles.managementText}>
          The address of your profile page. Letters, numbers, - and _, from 3 to{" "}
          {HANDLE_MAX_LENGTH} characters.
        </p>
        <form className={styles.row} onSubmit={onSubmit}>
          <input
            className={styles.input}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={HANDLE_MAX_LENGTH}
            aria-label="Handle"
            aria-describedby="public-profile-handle-help"
            aria-invalid={problem ? true : undefined}
            value={handle}
            onChange={(event) => {
              setHandle(event.target.value.toLowerCase());
              setConfirmingRename(false);
              setError(null);
            }}
            placeholder="your-name"
          />
          <Button
            type="submit"
            size="sm"
            disabled={saving || !changed || !handle || problem !== null}
          >
            {profile ? "Change handle" : "Save handle"}
          </Button>
        </form>
        {confirmingRename && profile && (
          <div className={clsx(styles.managementActions, styles.renameConfirm)}>
            <span className={styles.confirmText}>
              {getProfilePath(profile.handle)} will stop working straight away,
              and anyone can claim it.
            </span>
            <Button size="sm" onClick={onSubmit} disabled={saving}>
              Change it
            </Button>
            <Button variant="link" onClick={() => setConfirmingRename(false)}>
              Cancel
            </Button>
          </div>
        )}
        {message && (
          <p className={styles.error} role="alert">
            {message}
          </p>
        )}
      </section>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Show my profile</h3>
        {profile ? (
          <>
            <Switch
              id="public-profile-switch"
              label="Public"
              checked={profile.public}
              onChange={(checked) => {
                if (!saving) save({ ...profile, public: checked });
              }}
            />
            <p className={styles.managementText}>
              Profile pages aren&apos;t live yet. When they are, yours will be
              at clusterflick.com{getProfilePath(profile.handle)}, showing your
              Seen list and watchlist, while this is on.
            </p>
          </>
        ) : (
          <p className={styles.managementText}>
            Save a handle first. Your profile stays private until you switch it
            on here.
          </p>
        )}
      </section>
    </div>
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

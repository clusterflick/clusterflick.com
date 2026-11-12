"use client";

import clsx from "clsx";
import Button from "@/components/button";
import { getProfilePath } from "@/lib/user-profile";
import styles from "./page.module.css";

/**
 * The settings' one Save, stuck to the bottom of the screen while they're
 * in view, so it's never a scroll away from what was just changed. It says
 * whether there's anything to save, and what stops it saving, and holds the
 * Preview button where the preview isn't beside the settings.
 *
 * A rename frees the old address at once, so saving one asks here first.
 */
export default function SaveBar({
  changed,
  canSave,
  blocker,
  saving,
  error,
  confirmingRename,
  renameFrom,
  onSave,
  onDiscard,
  onCancelRename,
  onPreview,
}: {
  changed: boolean;
  canSave: boolean;
  /** Why it can't be saved, when there are changes that can't. */
  blocker?: string;
  saving: boolean;
  error: string | null;
  confirmingRename: boolean;
  renameFrom?: string;
  onSave: () => void;
  /** Absent when there's nothing saved to go back to. */
  onDiscard?: () => void;
  onCancelRename: () => void;
  /** Absent where the preview is already beside the settings. */
  onPreview?: () => void;
}) {
  const status = error
    ? error
    : confirmingRename && renameFrom
      ? `clusterflick.com${getProfilePath(renameFrom)} will stop working straight away, and anyone can claim it.`
      : !changed
        ? "All changes saved"
        : blocker
          ? blocker
          : "Unsaved changes";

  return (
    <div className={styles.saveBar} role="region" aria-label="Save changes">
      <p
        className={clsx(
          styles.saveStatus,
          changed && !error && styles.saveStatusChanged,
          error && styles.saveStatusError,
        )}
        aria-live="polite"
      >
        {status}
      </p>
      <div className={styles.saveActions}>
        {onPreview && (
          <Button variant="secondary" size="sm" onClick={onPreview}>
            Preview
          </Button>
        )}
        {confirmingRename ? (
          <>
            <Button variant="link" onClick={onCancelRename}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving}>
              Change it
            </Button>
          </>
        ) : (
          <>
            {changed && onDiscard && (
              <Button variant="link" onClick={onDiscard} disabled={saving}>
                Discard
              </Button>
            )}
            <Button
              size="sm"
              onClick={onSave}
              disabled={!changed || !canSave || saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

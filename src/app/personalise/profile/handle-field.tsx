"use client";

import clsx from "clsx";
import { HANDLE_MAX_LENGTH } from "@/lib/user-profile";
import personaliseStyles from "@/app/personalise/page.module.css";
import type { HandleAvailability } from "./use-handle-availability";
import styles from "./page.module.css";

/**
 * The handle, with its address and whether it's free beside it as it's
 * typed. Lowercased as it's typed, as handles are everywhere.
 */
export default function HandleField({
  value,
  onChange,
  handle,
  problem,
  availability,
}: {
  value: string;
  onChange: (value: string) => void;
  /** As it would be saved. */
  handle: string;
  problem?: string;
  availability: HandleAvailability;
}) {
  const address = `clusterflick.com/u/${handle || "your-handle"}`;
  const status: { text: string; tone?: "good" | "bad" } = problem
    ? value.trim()
      ? { text: problem, tone: "bad" }
      : {
          text: `Letters, numbers, - and _, from 3 to ${HANDLE_MAX_LENGTH} characters.`,
        }
    : availability === "yours"
      ? { text: "Your address." }
      : availability === "free"
        ? { text: "It's free.", tone: "good" }
        : availability === "taken"
          ? { text: "That's taken. Try another.", tone: "bad" }
          : availability === "error"
            ? { text: "Couldn't check just now. It's checked again on saving." }
            : { text: "Checking…" };

  return (
    <div className={styles.field}>
      <label htmlFor="profile-handle" className={styles.fieldLabel}>
        Handle
      </label>
      <input
        id="profile-handle"
        className={personaliseStyles.input}
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={HANDLE_MAX_LENGTH}
        aria-describedby="profile-handle-status"
        aria-invalid={status.tone === "bad" ? true : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value.toLowerCase())}
        placeholder="your-name"
      />
      <p
        id="profile-handle-status"
        className={clsx(
          styles.fieldHelp,
          status.tone === "good" && styles.fieldGood,
          status.tone === "bad" && styles.fieldProblem,
        )}
        aria-live="polite"
      >
        <span className={styles.address}>{address}</span> {status.text}
      </p>
    </div>
  );
}

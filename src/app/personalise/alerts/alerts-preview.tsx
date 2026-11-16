"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Button from "@/components/button";
import { formatDateLong } from "@clusterflick/catalogue/utils/format-date";
import {
  previewAlerts,
  type AlertPreview,
  type AlertTrigger,
  type PreviewMode,
} from "@/lib/user-alerts";
import { useUserContext } from "@/state/user-context";
import profileStyles from "@/app/personalise/profile/page.module.css";
import styles from "./page.module.css";

const MODES: { mode: PreviewMode; label: string }[] = [
  { mode: "sinceLastRun", label: "Tonight so far" },
  { mode: "everythingShowing", label: "Everything showing" },
];

/** Waits this long after a switch is flipped before asking again. */
const DEBOUNCE_MS = 400;

type PreviewState =
  | { step: "loading" }
  | { step: "failed" }
  | { step: "loaded"; preview: AlertPreview };

/** The answer to one request: which, so a stale one shows as loading. */
type Answer = { request: string } & (
  | { step: "failed" }
  | { step: "loaded"; preview: AlertPreview }
);

/**
 * The email the alerts would send, asked of the alerts Worker with the
 * switches as they stand, unsaved: tonight's so far, against the last run,
 * or one with everything on the watchlist that's showing, to see the email
 * with real listings. Shown in a sandboxed frame, as the email it is.
 */
export default function AlertsPreview({ notify }: { notify: AlertTrigger[] }) {
  const { getIdToken } = useUserContext();
  const [mode, setMode] = useState<PreviewMode>("sinceLastRun");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const triggers = notify.join(",");
  const request = `${mode}|${triggers}`;
  // Until the answer to these switches arrives, it's loading.
  const state: PreviewState =
    answer?.request === request ? answer : { step: "loading" };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getIdToken()
        .then((token) =>
          previewAlerts(
            token,
            mode,
            triggers ? (triggers.split(",") as AlertTrigger[]) : [],
            controller.signal,
          ),
        )
        .then(
          (preview) => setAnswer({ request, step: "loaded", preview }),
          (error) => {
            if (controller.signal.aborted) return;
            console.error("Failed to preview alerts", error);
            setAnswer({ request, step: "failed" });
          },
        );
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [getIdToken, mode, triggers, request]);

  return (
    <aside className={profileStyles.previewColumn} aria-label="Preview">
      <p className={profileStyles.previewLabel}>Preview · not sent</p>
      <div className={styles.previewModes} role="group" aria-label="Preview">
        {MODES.map(({ mode: each, label }) => (
          <Button
            key={each}
            size="sm"
            variant={mode === each ? "primary" : "secondary"}
            aria-pressed={mode === each}
            onClick={() => setMode(each)}
          >
            {label}
          </Button>
        ))}
      </div>
      <PreviewBody state={state} />
    </aside>
  );
}

function PreviewBody({ state }: { state: PreviewState }) {
  if (state.step === "loading") {
    return <p className={styles.previewNote}>Working it out…</p>;
  }
  if (state.step === "failed") {
    return (
      <p className={styles.previewNote}>
        We couldn&apos;t work out the preview just now.
      </p>
    );
  }
  const { preview } = state;
  if (preview.baseline) {
    return (
      <p className={styles.previewNote}>
        Alerts haven&apos;t run for you yet. The first night remembers your
        watchlist as it stands, and from then on each night&apos;s email has
        what&apos;s new since. Try &ldquo;Everything showing&rdquo; to see what
        one looks like.
      </p>
    );
  }
  if (!preview.digest) {
    return (
      <p className={styles.previewNote}>
        {preview.mode === "everythingShowing"
          ? "Nothing on your watchlist is showing right now."
          : `Nothing new${
              preview.lastRun
                ? ` since the last check, on ${formatDateLong(preview.lastRun)}`
                : ""
            }, so there'd be no email tonight.`}
      </p>
    );
  }
  return (
    <>
      <p className={styles.previewSubject}>
        <span className={styles.previewSubjectLabel}>Subject</span>{" "}
        {preview.digest.subject}
      </p>
      <iframe
        title="The email, as it would arrive"
        className={clsx(profileStyles.previewFrame, styles.previewFrame)}
        // An email, not a page: nothing in it runs.
        sandbox=""
        srcDoc={preview.digest.html}
      />
    </>
  );
}

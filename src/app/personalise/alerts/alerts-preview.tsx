"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import Button from "@/components/button";
import { formatDateLong } from "@clusterflick/catalogue/utils/format-date";
import {
  previewAlerts,
  type AlertPreview,
  type AlertTrigger,
  type AlertVenueScope,
  type PreviewMode,
} from "@/lib/user-alerts";
import { useUserContext } from "@/state/user-context";
import profileStyles from "@/app/personalise/profile/page.module.css";
import styles from "./page.module.css";

const MODES: { mode: PreviewMode; label: string; about: string }[] = [
  {
    mode: "sinceLastRun",
    label: "What's new tonight",
    about:
      "If tonight's check ran now, with the switches as they are: what's new since the last one.",
  },
  {
    mode: "everythingShowing",
    label: "Example email",
    about:
      "Every film on your watchlist that's showing, as if all of it were new, to show what an email looks like.",
  },
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
export default function AlertsPreview({
  notify,
  newVenueScope,
}: {
  notify: AlertTrigger[];
  newVenueScope: AlertVenueScope;
}) {
  const { getIdToken } = useUserContext();
  const [mode, setMode] = useState<PreviewMode>("sinceLastRun");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const triggers = notify.join(",");
  const request = `${mode}|${triggers}|${newVenueScope}`;
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
            newVenueScope,
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
  }, [getIdToken, mode, triggers, newVenueScope, request]);

  return (
    <aside className={profileStyles.previewColumn} aria-label="Preview">
      <p className={profileStyles.previewLabel}>Preview · never sent</p>
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
      <p className={styles.previewAbout}>
        {MODES.find((each) => each.mode === mode)?.about}
      </p>
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
        Nothing to compare with yet: tonight&apos;s check will be the first, and
        it remembers your watchlist as it stands. From the night after, this
        shows what&apos;s new since. Try &ldquo;Example email&rdquo; to see what
        one looks like.
      </p>
    );
  }
  if (!preview.digest) {
    return (
      <p className={styles.previewNote}>
        {preview.mode === "everythingShowing"
          ? "Nothing on your watchlist is showing right now, so there's no example to show."
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

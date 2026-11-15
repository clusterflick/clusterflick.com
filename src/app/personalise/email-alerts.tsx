"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { ButtonLink } from "@/components/button";
import ReleaseDot from "@/components/release-dot";
import {
  formatDateLong,
  formatShowingTime,
} from "@clusterflick/catalogue/utils/format-date";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  ALERT_TRIGGERS,
  AlertRunOutcome,
  AlertStopReason,
  AlertTrigger,
  DEFAULT_ALERT_SETTINGS,
  type AlertLedger,
  type AlertRun,
  type AlertSettings,
  type AlertStop,
} from "@/lib/user-alerts";
import { useUserContext } from "@/state/user-context";
import { ALERTS_SETTINGS_PATH } from "./alerts/path";
import OnOffItem from "./on-off-item";
import styles from "./page.module.css";

/** What sets off a watchlist alert, as the panel and the settings say it. */
export const TRIGGER_NAMES: Record<AlertTrigger, string> = {
  [AlertTrigger.FirstListing]: "When it's first listed",
  [AlertTrigger.NewVenue]: "When it's showing somewhere new",
  [AlertTrigger.NewPerformance]: "When any showing is added",
};

export const TRIGGER_DESCRIPTIONS: Record<AlertTrigger, string> = {
  [AlertTrigger.FirstListing]:
    "It wasn't showing anywhere in London for at least 30 days, and now it is.",
  [AlertTrigger.NewVenue]: "A cinema that wasn't showing it adds it.",
  [AlertTrigger.NewPerformance]:
    "Any new time at any cinema. Films showing across a chain get these almost every day.",
};

export type EmailAlertsState = {
  /** Whether the reader has the `emailAlerts` capability. */
  granted: boolean;
  /** The defaults before they've saved any. */
  settings: AlertSettings;
  /** Whether `settings` were saved, rather than the defaults. */
  saved: boolean;
  ledger: AlertLedger;
  /** Replaces the settings after a save. */
  onSaved: (settings: AlertSettings) => void;
};

/**
 * The capability, the settings and the Worker's ledger, read together. Null
 * until all three are known, and if any can't be read: as the public
 * profile's, a setting nobody can reach is better than a broken page.
 */
export function useEmailAlerts(): EmailAlertsState | null {
  const { status, readCapabilities, readAlertSettings, readAlertLedger } =
    useUserContext();
  const signedIn = status === "signed-in";
  const [state, setState] = useState<Omit<EmailAlertsState, "onSaved"> | null>(
    null,
  );

  // Only once signed in: reading before Firebase has said who is fails.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([readCapabilities(), readAlertSettings(), readAlertLedger()])
      .then(([capabilities, settings, ledger]) => {
        if (cancelled) return;
        setState({
          granted: CapabilityId.EmailAlerts in capabilities,
          settings: settings ?? DEFAULT_ALERT_SETTINGS,
          saved: settings !== null,
          ledger,
        });
      })
      .catch((error) => console.error("Failed to load email alerts", error));
    return () => {
      cancelled = true;
    };
  }, [signedIn, readCapabilities, readAlertSettings, readAlertLedger]);

  const onSaved = useCallback(
    (settings: AlertSettings) =>
      setState((current) => current && { ...current, settings, saved: true }),
    [],
  );

  return state && { ...state, onSaved };
}

/** "Monday, 16 November 2026 at 20:00" */
const formatWhen = (at: number) =>
  `${formatDateLong(at)} at ${formatShowingTime(at)}`;

/** The newest run, as one line: what happened, and when. */
export function describeRun(run: AlertRun): string {
  const when = formatWhen(run.at);
  switch (run.outcome) {
    case AlertRunOutcome.Sent:
      return `Last sent ${when}${
        run.films ? `, with ${run.films} film${run.films === 1 ? "" : "s"}` : ""
      }.`;
    case AlertRunOutcome.NothingNew:
      return `Last checked ${when}: nothing new, so no email.`;
    case AlertRunOutcome.Skipped:
      return `Last checked ${when}, but skipped${
        run.reason ? `: ${run.reason}` : ""
      }.`;
    case AlertRunOutcome.Failed:
      return `Last checked ${when}, but it went wrong${
        run.reason ? `: ${run.reason}` : ""
      }. We'll try again tomorrow.`;
    case AlertRunOutcome.NotResent:
      return `Last checked ${when}, but we can't tell whether that day's email went, so it wasn't sent again.`;
  }
}

/** Why the alerts Worker switched them off, as one line. */
export function describeStop(stop: AlertStop): string {
  const on = formatDateLong(stop.at);
  switch (stop.reason) {
    case AlertStopReason.Unsubscribed:
      return `You unsubscribed on ${on}${
        stop.emailOn
          ? `, from the email sent on ${formatDateLong(stop.emailOn)}`
          : ""
      }.`;
    case AlertStopReason.Bounced:
      return `Switched off on ${on}: your email provider refused our emails to your address.`;
    case AlertStopReason.Complained:
      return `Switched off on ${on}: one of our emails was marked as spam.`;
  }
}

/**
 * Opened from the account bar for a reader with the capability, as the public
 * profile's: whether alerts are on, when they last ran and how that went, and
 * the way to their settings; beside it, what they're alerted about.
 */
export function EmailAlertsSummary({
  settings,
  saved,
  ledger,
}: Pick<EmailAlertsState, "settings" | "saved" | "ledger">) {
  const [latest] = ledger.runs;
  const watchlist = settings.alerts.find((alert) => alert.type === "watchlist");
  return (
    <div className={clsx(styles.management, styles.profileManagement)}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Your alerts</h3>
        <p className={styles.managementText}>
          {saved && <ReleaseDot off={!settings.enabled} />}
          {settings.enabled
            ? "On: a daily email at 8pm when there's something new for you."
            : saved
              ? "Off: nothing is sent."
              : "Get a daily email when films on your watchlist are showing. Nothing is sent until you switch it on."}
        </p>
        {!settings.enabled && ledger.stopped && (
          <p className={styles.managementText}>
            {describeStop(ledger.stopped)}
          </p>
        )}
        {latest && (
          <p className={styles.managementText}>{describeRun(latest)}</p>
        )}
        <div className={styles.managementActions}>
          <ButtonLink
            href={ALERTS_SETTINGS_PATH}
            size="sm"
            variant={settings.enabled ? "secondary" : "primary"}
          >
            {saved ? "Edit alerts" : "Set up alerts"}
          </ButtonLink>
        </div>
      </section>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Your watchlist</h3>
        <ul className={styles.onOffList} aria-label="Watchlist alert">
          {ALERT_TRIGGERS.map((trigger) => (
            <OnOffItem
              key={trigger}
              on={Boolean(watchlist?.notify.includes(trigger))}
              label={TRIGGER_NAMES[trigger]}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

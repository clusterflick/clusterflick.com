"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import {
  ALERT_TRIGGERS,
  AlertTrigger,
  type AlertSettings,
  type WatchlistAlert,
} from "@/lib/user-alerts";
import {
  describeStop,
  TRIGGER_DESCRIPTIONS,
  TRIGGER_NAMES,
  useEmailAlerts,
  type EmailAlertsState,
} from "@/app/personalise/email-alerts";
import personaliseStyles from "@/app/personalise/page.module.css";
import SettingsCard from "@/app/personalise/profile/settings-card";
import SaveBar from "@/app/personalise/profile/save-bar";
import profileStyles from "@/app/personalise/profile/page.module.css";
import AlertsPreview from "./alerts-preview";
import styles from "./page.module.css";

const PERSONALISE_PATH = "/personalise/";

const SAVE_FAILED = "Something went wrong saving that. Please try again.";

/**
 * Where a reader with the `emailAlerts` capability switches their alerts on
 * or off and chooses what counts as news, saved with one button, as the
 * profile's settings are; beside them, where there's room, a preview of the
 * email those choices would send.
 */
export default function AlertsSettingsPageContent() {
  const { status } = useUserContext();
  const state = useEmailAlerts();
  const signedIn = status === "signed-in";

  return (
    <StandardPageLayout
      title="Your Email Alerts"
      subtitle="A daily email when films on your watchlist are showing."
      afterContent={
        signedIn && state?.granted ? <Editor state={state} /> : undefined
      }
    >
      {status === "unavailable" ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Not available yet"
          message="Personalisation isn't switched on in this build."
        />
      ) : status === "checking" || (signedIn && !state) ? (
        <LoadingIndicator message="Loading your alerts…" />
      ) : !signedIn ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Sign in first"
          message="Alerts are about your watchlist, so they start with an account."
          actions={<ButtonLink href={PERSONALISE_PATH}>Sign in</ButtonLink>}
        />
      ) : state && !state.granted ? (
        <NotGranted state={state} />
      ) : null}
    </StandardPageLayout>
  );
}

/**
 * Without the capability there's nothing to set up, except alerts left on
 * when it was revoked, which can still be switched off. The Worker sends
 * nothing without the capability either way.
 */
function NotGranted({ state }: { state: EmailAlertsState }) {
  if (state.settings.enabled) return <Editor state={state} offOnly />;
  return (
    <EmptyState
      icon={{
        src: "/images/icons/neon-projector.svg",
        width: 120,
        height: 120,
      }}
      title="Not switched on for you yet"
      message="Email alerts are being opened up a few readers at a time, and aren't switched on for your account yet."
      actions={
        <ButtonLink href={PERSONALISE_PATH}>Back to Personalise</ButtonLink>
      }
    />
  );
}

const isSame = (a: AlertSettings, b: AlertSettings) =>
  JSON.stringify(a) === JSON.stringify(b);

function Editor({
  state,
  offOnly = false,
}: {
  state: EmailAlertsState;
  /** Without the capability: only switching off is allowed. */
  offOnly?: boolean;
}) {
  const { email, saveAlertSettings } = useUserContext();
  const { settings, saved, ledger, onSaved } = state;
  const [draft, setDraft] = useState<AlertSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchlist: WatchlistAlert = draft.alerts.find(
    (alert) => alert.type === "watchlist",
  ) ?? { type: "watchlist", notify: [] };
  const changed = !saved || !isSame(draft, settings);
  // Off with no triggers is fine to save; on needs at least one.
  const blocker =
    draft.enabled && watchlist.notify.length === 0
      ? "Choose at least one thing to be told about"
      : offOnly && draft.enabled
        ? "Alerts can only be switched off"
        : undefined;

  // Leaving with changes unsaved asks first; the browser words it.
  useEffect(() => {
    if (!changed || !saved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed, saved]);

  const update = (next: AlertSettings) => {
    setDraft(next);
    setError(null);
  };

  const setTrigger = (trigger: AlertTrigger, on: boolean) => {
    const notify = ALERT_TRIGGERS.filter((each) =>
      each === trigger ? on : watchlist.notify.includes(each),
    );
    update({ ...draft, alerts: [{ type: "watchlist", notify }] });
  };

  const onSave = async () => {
    if (blocker) return;
    // An alert nothing sets off isn't saved: it would read back as none.
    const next: AlertSettings = {
      ...draft,
      alerts: watchlist.notify.length > 0 ? [watchlist] : [],
    };
    setSaving(true);
    setError(null);
    try {
      await saveAlertSettings(next);
      onSaved(next);
      setDraft(next);
    } catch (saveError) {
      console.error("Failed to save email alerts", saveError);
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={profileStyles.editor}>
      <div className={profileStyles.settings}>
        <SettingsCard
          title="Email alerts"
          intro={
            <>
              One email a day, at 8pm, to <strong>{email}</strong>, when
              there&apos;s something new about a film on your watchlist. Nothing
              is sent on a day with nothing new.
            </>
          }
        >
          <Switch
            id="alerts-enabled"
            label="Send me alerts"
            checked={draft.enabled}
            onChange={(enabled) => update({ ...draft, enabled })}
            disabled={offOnly && !draft.enabled}
            className={personaliseStyles.managementSwitch}
          />
          {!settings.enabled && ledger.stopped && (
            <p
              className={`${personaliseStyles.managementText} ${styles.stopNote}`}
            >
              {describeStop(ledger.stopped)}
            </p>
          )}
        </SettingsCard>

        <SettingsCard
          title="Your watchlist"
          intro="Tell me when a film on my watchlist:"
        >
          <ul className={profileStyles.sections}>
            {ALERT_TRIGGERS.map((trigger) => (
              <li key={trigger} className={profileStyles.section}>
                <Switch
                  id={`alerts-trigger-${trigger}`}
                  label={TRIGGER_NAMES[trigger]}
                  checked={watchlist.notify.includes(trigger)}
                  onChange={(on) => setTrigger(trigger, on)}
                  describedBy={`alerts-trigger-${trigger}-help`}
                  className={personaliseStyles.managementSwitch}
                />
                <p
                  id={`alerts-trigger-${trigger}-help`}
                  className={profileStyles.sectionHelp}
                >
                  {TRIGGER_DESCRIPTIONS[trigger]}
                </p>
              </li>
            ))}
          </ul>
        </SettingsCard>

        <SaveBar
          changed={changed}
          canSave={!blocker}
          blocker={blocker}
          saving={saving}
          error={error}
          confirmingRename={false}
          onSave={onSave}
          onDiscard={
            saved
              ? () => {
                  setDraft(settings);
                  setError(null);
                }
              : undefined
          }
          onCancelRename={() => {}}
        />
      </div>
      {!offOnly && <AlertsPreview notify={watchlist.notify} />}
    </div>
  );
}

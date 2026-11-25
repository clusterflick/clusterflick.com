"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/button";
import Chip from "@/components/chip";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import {
  rememberWatchlist,
  ALERT_TRIGGERS,
  ALERT_VENUE_SCOPES,
  AlertTrigger,
  AlertVenueScope,
  type AlertSettings,
  type WatchlistAlert,
} from "@/lib/user-alerts";
import {
  describeStop,
  TRIGGER_DESCRIPTIONS,
  TRIGGER_NAMES,
  VENUE_SCOPE_NAMES,
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

const REMEMBER_FAILED =
  "Alerts are on. We couldn't note your watchlist just now, so tonight's check will only do that, and your first email may come a day later.";

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

/**
 * `settings` with the watchlist alert replaced where it stood, or left out
 * when `watchlist` is null. Every other alert is kept as it is: this page
 * edits the watchlist's, and saving it must not drop a reader's searches.
 */
function withWatchlist(
  settings: AlertSettings,
  watchlist: WatchlistAlert | null,
): AlertSettings {
  const others = settings.alerts.filter((alert) => alert.type !== "watchlist");
  if (!watchlist) return { ...settings, alerts: others };
  const at = settings.alerts.findIndex((alert) => alert.type === "watchlist");
  const alerts: AlertSettings["alerts"] = [...others];
  alerts.splice(at === -1 ? 0 : at, 0, watchlist);
  return { ...settings, alerts };
}

function Editor({
  state,
  offOnly = false,
}: {
  state: EmailAlertsState;
  /** Without the capability: only switching off is allowed. */
  offOnly?: boolean;
}) {
  const { email, saveAlertSettings, getIdToken, favouriteVenues } =
    useUserContext();
  const { settings, saved, ledger, onSaved } = state;
  const [draft, setDraft] = useState<AlertSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const watchlist: WatchlistAlert = draft.alerts.find(
    (alert) => alert.type === "watchlist",
  ) ?? { type: "watchlist", notify: [], newVenueScope: AlertVenueScope.Any };
  // Favourites with none yet would never tell them about a new venue. Not
  // said while they're still loading (null), when there may be some.
  const noFavourites =
    watchlist.notify.includes(AlertTrigger.NewVenue) &&
    watchlist.newVenueScope === AlertVenueScope.Favourites &&
    favouriteVenues !== null &&
    Object.keys(favouriteVenues).length === 0;
  // Against what the page opened with, saved or the defaults: opening it
  // changes nothing.
  const changed = !isSame(draft, settings);
  // Off with no triggers is fine to save; on needs something to be told
  // about: a watchlist trigger, or a saved search.
  const hasAlert =
    watchlist.notify.length > 0 ||
    draft.alerts.some((alert) => alert.type === "search");
  const blocker =
    draft.enabled && !hasAlert
      ? "Choose at least one thing to be told about"
      : offOnly && draft.enabled
        ? "Alerts can only be switched off"
        : undefined;

  // Leaving with changes unsaved asks first; the browser words it.
  useEffect(() => {
    if (!changed) return;
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
    update(withWatchlist(draft, { ...watchlist, notify }));
  };

  const setVenueScope = (newVenueScope: AlertVenueScope) => {
    update(withWatchlist(draft, { ...watchlist, newVenueScope }));
  };

  const onSave = async () => {
    if (blocker) return;
    // An alert nothing sets off isn't saved: it would read back as none.
    const next = withWatchlist(
      draft,
      watchlist.notify.length > 0 ? watchlist : null,
    );
    // Switched on by this save, so news starts from now.
    const switchingOn = next.enabled && !(saved && settings.enabled);
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveAlertSettings(next);
      onSaved(next);
      setDraft(next);
      if (switchingOn) {
        // The alerts are on whatever happens here: without it, tonight's
        // check only remembers the watchlist, and news starts tomorrow.
        try {
          await rememberWatchlist(await getIdToken());
        } catch (rememberError) {
          console.error("Failed to remember the watchlist", rememberError);
          setNotice(REMEMBER_FAILED);
        }
      }
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
          {notice && (
            <p
              className={`${personaliseStyles.managementText} ${styles.stopNote}`}
              role="status"
            >
              {notice}
            </p>
          )}
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
                {trigger === AlertTrigger.NewVenue &&
                  watchlist.notify.includes(trigger) && (
                    <>
                      <div
                        className={styles.scopes}
                        role="radiogroup"
                        aria-label="Which cinemas count"
                      >
                        {ALERT_VENUE_SCOPES.map((scope) => (
                          <Chip
                            key={scope}
                            type="radio"
                            name="alerts-new-venue-scope"
                            label={VENUE_SCOPE_NAMES[scope]}
                            value={scope}
                            checked={watchlist.newVenueScope === scope}
                            onChange={(value) =>
                              setVenueScope(value as AlertVenueScope)
                            }
                          />
                        ))}
                      </div>
                      {noFavourites && (
                        <p className={profileStyles.sectionHelp} role="status">
                          You haven&apos;t favourited any venues yet, so this
                          won&apos;t tell you about any until you do.
                        </p>
                      )}
                    </>
                  )}
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
          onDiscard={() => {
            setDraft(settings);
            setError(null);
          }}
          unchangedStatus={saved ? undefined : "Nothing saved yet"}
          onCancelRename={() => {}}
        />
      </div>
      {!offOnly && (
        <AlertsPreview
          notify={watchlist.notify}
          newVenueScope={watchlist.newVenueScope}
        />
      )}
    </div>
  );
}

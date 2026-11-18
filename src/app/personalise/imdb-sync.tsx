"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import Button from "@/components/button";
import ReleaseDot from "@/components/release-dot";
import {
  formatDateLong,
  formatShowingTime,
} from "@clusterflick/catalogue/utils/format-date";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  getImdbProfileUrl,
  getImdbTitleUrl,
  ImdbRunOutcome,
  ImdbUnmatchedReason,
  linkImdb,
  readImdbUser,
  type ImdbLedger,
  type ImdbLink,
  type ImdbLinkRefusal,
  type ImdbRun,
} from "@/lib/user-imdb";
import { useUserContext } from "@/state/user-context";
import styles from "./page.module.css";

/*
 * The IMDb sync's panel: the Letterboxd sync's (`./letterboxd-sync`) with
 * IMDb behind it. A reader links a profile rather than a username, IMDb's
 * Seen is what they've rated or reviewed, and IMDb can't say "no such user",
 * only that it couldn't confirm one.
 */

export type ImdbSyncState = {
  /** Whether the reader has the `imdbSync` capability. */
  granted: boolean;
  link: ImdbLink | null;
  ledger: ImdbLedger;
  /** Replaces the link after linking or unlinking. */
  onLinkChange: (link: ImdbLink | null) => void;
};

/**
 * The capability, the link and the sync Worker's ledger, read together. Null
 * until all three are known, and if any can't be read: as the Letterboxd
 * sync's, a setting nobody can reach is better than a broken page.
 */
export function useImdbSync(): ImdbSyncState | null {
  const { status, readCapabilities, readImdbSync } = useUserContext();
  const signedIn = status === "signed-in";
  const [state, setState] = useState<Omit<
    ImdbSyncState,
    "onLinkChange"
  > | null>(null);

  // Only once signed in: reading before Firebase has said who is fails.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([readCapabilities(), readImdbSync()])
      .then(([capabilities, { link, ledger }]) => {
        if (cancelled) return;
        setState({
          granted: CapabilityId.ImdbSync in capabilities,
          link,
          ledger,
        });
      })
      .catch((error) => console.error("Failed to load IMDb sync", error));
    return () => {
      cancelled = true;
    };
  }, [signedIn, readCapabilities, readImdbSync]);

  const onLinkChange = useCallback(
    (link: ImdbLink | null) =>
      setState((current) => current && { ...current, link }),
    [],
  );

  return state && { ...state, onLinkChange };
}

/** "Monday, 16 November 2026 at 04:47" */
const formatWhen = (at: number) =>
  `${formatDateLong(at)} at ${formatShowingTime(at)}`;

const films = (count: number) => `${count} film${count === 1 ? "" : "s"}`;

/** The newest run, as one line: what happened, and when. */
export function describeImdbSyncRun(run: ImdbRun): string {
  const when = formatWhen(run.at);
  const waiting = run.remaining
    ? ` ${films(run.remaining)} more will follow over the next nights.`
    : "";
  const watchlist = run.watchlistPrivate
    ? " IMDb didn't share your watchlist, so only the films you've rated or reviewed were synced."
    : "";
  switch (run.outcome) {
    case ImdbRunOutcome.Synced: {
      const { watchlist: toWatchlist = 0, seen = 0 } = run.added ?? {};
      const parts = [
        toWatchlist > 0 && `${films(toWatchlist)} to your watchlist`,
        seen > 0 && `${films(seen)} to Seen`,
      ].filter(Boolean);
      return `Last synced ${when}: added ${parts.join(" and ")}.${waiting}${watchlist}`;
    }
    case ImdbRunOutcome.NothingNew:
      return `Last synced ${when}: nothing new.${waiting}${watchlist}`;
    case ImdbRunOutcome.Skipped:
      return `Last checked ${when}, but skipped${
        run.reason ? `: ${run.reason}` : ""
      }.`;
    case ImdbRunOutcome.Failed:
      return `Last checked ${when}, but it went wrong${
        run.reason ? `: ${run.reason}` : ""
      }. We'll try again tomorrow.`;
  }
}

const UNMATCHED_REASONS: Record<ImdbUnmatchedReason, string> = {
  [ImdbUnmatchedReason.NoTmdbFilm]: "not a film TheMovieDB has",
  [ImdbUnmatchedReason.NotOnTmdb]: "no longer on TheMovieDB",
};

const REFUSALS: Record<ImdbLinkRefusal, string> = {
  invalid_user:
    "That isn't an IMDb profile. Paste the address of your profile or your watchlist on imdb.com.",
  not_confirmed:
    "IMDb couldn't confirm that profile. Check the address, or try again later.",
  not_granted: "IMDb sync isn't switched on for your account.",
  unavailable: "We couldn't reach IMDb just now. Please try again later.",
};

/** How many unmatched films the panel names before counting the rest. */
const UNMATCHED_SHOWN = 10;

/**
 * Opened from the account bar for a reader with the capability: the
 * profile linked and how the last sync went, with the way to unlink; before
 * one is linked, the profile to link. Beside it, the films the last sync
 * couldn't add.
 */
export function ImdbSyncSummary({
  link,
  ledger,
  onLinkChange,
}: Pick<ImdbSyncState, "link" | "ledger" | "onLinkChange">) {
  const [latest] = ledger.runs;
  return (
    <div className={clsx(styles.management, styles.profileManagement)}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>IMDb</h3>
        {link ? (
          <Linked
            link={link}
            latest={latest}
            onUnlinked={() => onLinkChange(null)}
          />
        ) : (
          <LinkForm onLinked={onLinkChange} />
        )}
      </section>
      {link && ledger.unmatched.length > 0 && (
        <section className={styles.managementSection}>
          <h3 className={styles.managementTitle}>Not added</h3>
          <p className={styles.managementText}>
            These are on your IMDb lists, but couldn&apos;t be matched to a film
            here.
          </p>
          <ul className={styles.syncUnmatched}>
            {ledger.unmatched.slice(0, UNMATCHED_SHOWN).map((film) => (
              <li key={`${film.list}-${film.imdbId}`}>
                <a
                  href={getImdbTitleUrl(film.imdbId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {film.name}
                  {film.year ? ` (${film.year})` : ""}
                </a>
                : {UNMATCHED_REASONS[film.reason]}
              </li>
            ))}
          </ul>
          {ledger.unmatched.length > UNMATCHED_SHOWN && (
            <p className={styles.managementText}>
              And {ledger.unmatched.length - UNMATCHED_SHOWN} more.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Linked({
  link,
  latest,
  onUnlinked,
}: {
  link: ImdbLink;
  latest: ImdbRun | undefined;
  onUnlinked: () => void;
}) {
  const { unlinkImdb } = useUserContext();
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlink = async () => {
    setUnlinking(true);
    setError(null);
    try {
      await unlinkImdb();
      onUnlinked();
    } catch (failure) {
      console.error("Failed to unlink IMDb", failure);
      setError("We couldn't unlink it. Please try again.");
      setUnlinking(false);
    }
  };

  return (
    <>
      <p className={styles.managementText}>
        <ReleaseDot /> Linked to{" "}
        <a
          href={getImdbProfileUrl(link)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.username ?? link.profileId}
        </a>
        . Every night, films on your IMDb watchlist and films you&apos;ve rated
        or reviewed there are added to your lists here. Nothing is taken off.
      </p>
      <p className={styles.managementText}>
        {latest ? describeImdbSyncRun(latest) : "The first sync runs tonight."}
      </p>
      <div className={styles.managementActions}>
        <Button
          variant="secondary"
          size="sm"
          disabled={unlinking}
          onClick={unlink}
        >
          {unlinking ? "Unlinking…" : "Unlink"}
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function LinkForm({ onLinked }: { onLinked: (link: ImdbLink) => void }) {
  const { getIdToken } = useUserContext();
  const [user, setUser] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const id = readImdbUser(user);
      if (!id) {
        setError(REFUSALS.invalid_user);
        return;
      }
      setLinking(true);
      setError(null);
      try {
        const result = await linkImdb(await getIdToken(), id);
        if (result.ok) onLinked(result.link);
        else setError(REFUSALS[result.error]);
      } catch (failure) {
        console.error("Failed to link IMDb", failure);
        setError(REFUSALS.unavailable);
      } finally {
        setLinking(false);
      }
    },
    [user, getIdToken, onLinked],
  );

  return (
    <form onSubmit={submit}>
      <p className={styles.managementText}>
        Add your IMDb watchlist, and the films you&apos;ve rated or reviewed
        there, to your lists here, every night. Nothing is ever taken off your
        lists, and only what anyone can see on your IMDb profile is read.
        IMDb&apos;s watch history can&apos;t be read, so rate a film there to
        have it marked as seen here.
      </p>
      <div className={styles.assistantAddressRow}>
        <input
          className={styles.input}
          type="text"
          value={user}
          onChange={(event) => setUser(event.target.value)}
          placeholder="Your IMDb profile address"
          aria-label="Your IMDb profile address"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={200}
          disabled={linking}
        />
        <Button size="sm" type="submit" disabled={linking || !user.trim()}>
          {linking ? "Checking…" : "Link"}
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

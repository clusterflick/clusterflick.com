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
  isLetterboxdUsername,
  LetterboxdRunOutcome,
  linkLetterboxd,
  UnmatchedReason,
  type LetterboxdLedger,
  type LetterboxdLink,
  type LetterboxdRun,
  type LinkRefusal,
} from "@/lib/user-letterboxd";
import { useUserContext } from "@/state/user-context";
import styles from "./page.module.css";

export type LetterboxdSyncState = {
  /** Whether the reader has the `letterboxdSync` capability. */
  granted: boolean;
  link: LetterboxdLink | null;
  ledger: LetterboxdLedger;
  /** Replaces the link after linking or unlinking. */
  onLinkChange: (link: LetterboxdLink | null) => void;
};

/**
 * The capability, the link and the sync Worker's ledger, read together. Null
 * until all three are known, and if any can't be read: as the email alerts',
 * a setting nobody can reach is better than a broken page.
 */
export function useLetterboxdSync(): LetterboxdSyncState | null {
  const { status, readCapabilities, readLetterboxdSync } = useUserContext();
  const signedIn = status === "signed-in";
  const [state, setState] = useState<Omit<
    LetterboxdSyncState,
    "onLinkChange"
  > | null>(null);

  // Only once signed in: reading before Firebase has said who is fails.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([readCapabilities(), readLetterboxdSync()])
      .then(([capabilities, { link, ledger }]) => {
        if (cancelled) return;
        setState({
          granted: CapabilityId.LetterboxdSync in capabilities,
          link,
          ledger,
        });
      })
      .catch((error) => console.error("Failed to load Letterboxd sync", error));
    return () => {
      cancelled = true;
    };
  }, [signedIn, readCapabilities, readLetterboxdSync]);

  const onLinkChange = useCallback(
    (link: LetterboxdLink | null) =>
      setState((current) => current && { ...current, link }),
    [],
  );

  return state && { ...state, onLinkChange };
}

/** "Monday, 16 November 2026 at 04:17" */
const formatWhen = (at: number) =>
  `${formatDateLong(at)} at ${formatShowingTime(at)}`;

const films = (count: number) => `${count} film${count === 1 ? "" : "s"}`;

/** The newest run, as one line: what happened, and when. */
export function describeSyncRun(run: LetterboxdRun): string {
  const when = formatWhen(run.at);
  const waiting = run.remaining
    ? ` ${films(run.remaining)} more will follow over the next nights.`
    : "";
  const watchlist = run.watchlistPrivate
    ? " Your Letterboxd watchlist is private, so only your watched films were synced."
    : "";
  switch (run.outcome) {
    case LetterboxdRunOutcome.Synced: {
      const { watchlist: toWatchlist = 0, seen = 0 } = run.added ?? {};
      const parts = [
        toWatchlist > 0 && `${films(toWatchlist)} to your watchlist`,
        seen > 0 && `${films(seen)} to Seen`,
      ].filter(Boolean);
      return `Last synced ${when}: added ${parts.join(" and ")}.${waiting}${watchlist}`;
    }
    case LetterboxdRunOutcome.NothingNew:
      return `Last synced ${when}: nothing new.${waiting}${watchlist}`;
    case LetterboxdRunOutcome.Skipped:
      return `Last checked ${when}, but skipped${
        run.reason ? `: ${run.reason}` : ""
      }.`;
    case LetterboxdRunOutcome.Failed:
      return `Last checked ${when}, but it went wrong${
        run.reason ? `: ${run.reason}` : ""
      }. We'll try again tomorrow.`;
  }
}

const UNMATCHED_REASONS: Record<UnmatchedReason, string> = {
  [UnmatchedReason.NoTmdbFilm]: "not a film TheMovieDB has",
  [UnmatchedReason.NotOnTmdb]: "no longer on TheMovieDB",
};

const REFUSALS: Record<LinkRefusal, string> = {
  invalid_username:
    "That isn't a Letterboxd username: they're 2 to 15 letters, numbers or underscores.",
  not_found: "Letterboxd doesn't have anyone with that username.",
  not_granted: "Letterboxd sync isn't switched on for your account.",
  unavailable: "We couldn't reach Letterboxd just now. Please try again later.",
};

/** How many unmatched films the panel names before counting the rest. */
const UNMATCHED_SHOWN = 10;

/**
 * Opened from the account bar for a reader with the capability: the
 * account linked and how the last sync went, with the way to unlink; before
 * one is linked, the username to link. Beside it, the films the last sync
 * couldn't add.
 */
export function LetterboxdSyncSummary({
  link,
  ledger,
  onLinkChange,
}: Pick<LetterboxdSyncState, "link" | "ledger" | "onLinkChange">) {
  const [latest] = ledger.runs;
  // Said once, on linking: each run's line says it again.
  const [watchlistPrivate, setWatchlistPrivate] = useState(false);
  return (
    <div className={clsx(styles.management, styles.profileManagement)}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Letterboxd</h3>
        {link ? (
          <Linked
            link={link}
            latest={latest}
            watchlistPrivate={watchlistPrivate}
            onUnlinked={() => onLinkChange(null)}
          />
        ) : (
          <LinkForm
            onLinked={(linked, isPrivate) => {
              setWatchlistPrivate(isPrivate);
              onLinkChange(linked);
            }}
          />
        )}
      </section>
      {link && ledger.unmatched.length > 0 && (
        <section className={styles.managementSection}>
          <h3 className={styles.managementTitle}>Not added</h3>
          <p className={styles.managementText}>
            These are on your Letterboxd lists, but couldn&apos;t be matched to
            a film here.
          </p>
          <ul className={styles.syncUnmatched}>
            {ledger.unmatched.slice(0, UNMATCHED_SHOWN).map((film) => (
              <li key={`${film.list}-${film.url}`}>
                <a href={film.url} target="_blank" rel="noopener noreferrer">
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
  watchlistPrivate,
  onUnlinked,
}: {
  link: LetterboxdLink;
  latest: LetterboxdRun | undefined;
  /** Letterboxd said so when it was linked. */
  watchlistPrivate: boolean;
  onUnlinked: () => void;
}) {
  const { unlinkLetterboxd } = useUserContext();
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlink = async () => {
    setUnlinking(true);
    setError(null);
    try {
      await unlinkLetterboxd();
      onUnlinked();
    } catch (failure) {
      console.error("Failed to unlink Letterboxd", failure);
      setError("We couldn't unlink it. Please try again.");
      setUnlinking(false);
    }
  };

  return (
    <>
      <p className={styles.managementText}>
        <ReleaseDot /> Linked to{" "}
        <a
          href={`https://letterboxd.com/${encodeURIComponent(link.username)}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.username}
        </a>
        . Every night, films on your Letterboxd watchlist and films you&apos;ve
        watched there are added to your lists here. Nothing is taken off.
      </p>
      <p className={styles.managementText}>
        {latest ? describeSyncRun(latest) : "The first sync runs tonight."}
      </p>
      {watchlistPrivate && (
        <p className={styles.managementText}>
          Your Letterboxd watchlist is private, so only your watched films will
          be synced. Make it public on Letterboxd to sync it too.
        </p>
      )}
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

function LinkForm({
  onLinked,
}: {
  onLinked: (link: LetterboxdLink, watchlistPrivate: boolean) => void;
}) {
  const { getIdToken } = useUserContext();
  const [username, setUsername] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const trimmed = username.trim();
      if (!isLetterboxdUsername(trimmed)) {
        setError(REFUSALS.invalid_username);
        return;
      }
      setLinking(true);
      setError(null);
      try {
        const result = await linkLetterboxd(await getIdToken(), trimmed);
        if (result.ok) onLinked(result.link, result.watchlistPrivate);
        else setError(REFUSALS[result.error]);
      } catch (failure) {
        console.error("Failed to link Letterboxd", failure);
        setError(REFUSALS.unavailable);
      } finally {
        setLinking(false);
      }
    },
    [username, getIdToken, onLinked],
  );

  return (
    <form onSubmit={submit}>
      <p className={styles.managementText}>
        Add your Letterboxd watchlist and the films you&apos;ve watched there to
        your lists here, every night. Nothing is ever taken off your lists, and
        only what anyone can see on your Letterboxd profile is read.
      </p>
      <div className={styles.assistantAddressRow}>
        <input
          className={styles.input}
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Your Letterboxd username"
          aria-label="Your Letterboxd username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={15}
          disabled={linking}
        />
        <Button size="sm" type="submit" disabled={linking || !username.trim()}>
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

"use client";

import { Fragment, useRef, useState, type ChangeEvent } from "react";
import Button from "@/components/button";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  toUserListEntry,
  UserListId,
  type UserListEntry,
} from "@/lib/user-lists";
import {
  formatLetterboxdCsv,
  getTitleYearKey,
  LetterboxdCsvError,
  matchLetterboxdRows,
  parseLetterboxdCsv,
  type LetterboxdRow,
} from "@/lib/user-lists/letterboxd-csv";
import {
  estimateLookupMinutes,
  lookUpRowsOnTmdb,
} from "@/lib/user-lists/tmdb-lookup";
import FilmSearch from "./film-search";
import styles from "./page.module.css";

const LIST_NAMES: Record<UserListId, string> = {
  [UserListId.Watchlist]: "Watchlist",
  [UserListId.Seen]: "Seen",
};

/** The file in Letterboxd's export zip that holds each list. */
const LETTERBOXD_FILES: Record<UserListId, string> = {
  [UserListId.Watchlist]: "watchlist.csv",
  [UserListId.Seen]: "watched.csv",
};

/** Titles listed in an import's review before the rest become "and N more". */
const REVIEW_TITLE_LIMIT = 12;

type ImportReviewState = {
  listId: UserListId;
  fileName: string;
  /** Films the file names. */
  total: number;
  /** Films not already on the list, whether showing or not. */
  entries: Record<string, UserListEntry>;
  /** How many of `entries` are showing now. */
  showing: number;
  /** Named by the file but on the list already. */
  alreadyListed: number;
  /** Films TheMovieDB has no match for. */
  missing: LetterboxdRow[];
};

type ImportState =
  | { step: "idle" }
  | {
      step: "looking-up";
      listId: UserListId;
      fileName: string;
      /** Films being looked up on TheMovieDB, and how many are done. */
      total: number;
      done: number;
    }
  | ({ step: "review" | "importing" } & ImportReviewState)
  | { step: "done"; listId: UserListId; count: number }
  | { step: "error"; message: string };

function plural(count: number, noun: string) {
  return `${count.toLocaleString("en-GB")} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The films an import would add. Those showing link to their pages, in a new
 * tab so checking one doesn't lose the review — which lives only in this
 * page's state. The rest have no page to link to.
 */
function ReviewTitles({
  films,
}: {
  films: { id: string; title: string; href?: string }[];
}) {
  const shown = films.slice(0, REVIEW_TITLE_LIMIT);
  const rest = films.length - shown.length;
  return (
    <p className={styles.importTitles}>
      {shown.map((film, index) => (
        <Fragment key={film.id}>
          {index > 0 && ", "}
          {film.href ? (
            <a href={film.href} target="_blank" rel="noopener noreferrer">
              {film.title}
            </a>
          ) : (
            film.title
          )}
        </Fragment>
      ))}
      {rest > 0 && ` and ${rest.toLocaleString("en-GB")} more`}
    </p>
  );
}

function downloadCsv(fileName: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next turn, once the download has taken its copy.
  setTimeout(() => URL.revokeObjectURL(url));
}

/**
 * Whether the lists show their Remove buttons, importing from and exporting to
 * Letterboxd, and adding a film that isn't showing. Tucked under the account
 * bar: all of it is occasional. The search comes last as the one part that
 * grows, so its results push nothing else down.
 */
export default function ListManagement({
  showRemove,
  onShowRemoveChange,
}: {
  showRemove: boolean;
  onShowRemoveChange: (show: boolean) => void;
}) {
  return (
    <div className={styles.management}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Editing</h3>
        <Switch
          id="personalise-show-remove"
          label="Show Remove buttons on your lists"
          checked={showRemove}
          onChange={onShowRemoveChange}
          className={styles.managementSwitch}
        />
      </section>
      <ImportSection />
      <ExportSection />
      <FilmSearch />
    </div>
  );
}

function ImportSection() {
  const { lists, importToList, getIdToken } = useUserContext();
  const { movies, hasAttemptedLoad, isLoading, error } = useCinemaData();
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<UserListId>(UserListId.Watchlist);
  const lookupRef = useRef<AbortController | null>(null);
  // Matching starts with what's showing, so it waits for the data.
  const ready = !!lists && hasAttemptedLoad && !isLoading && !error;

  const choose = (listId: UserListId) => {
    targetRef.current = listId;
    inputRef.current?.click();
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared, so choosing the same file again still fires a change.
    event.target.value = "";
    if (!file || !lists) return;
    const listId = targetRef.current;
    const listed = lists[listId];

    let rows: LetterboxdRow[];
    try {
      rows = parseLetterboxdCsv(await file.text());
    } catch (caught) {
      setState({
        step: "error",
        message:
          caught instanceof LetterboxdCsvError
            ? `${file.name} doesn't look like a Letterboxd export — it has no Name or Title column.`
            : `We couldn't read ${file.name}.`,
      });
      return;
    }

    // Films showing now resolve against the dataset. The rest go to
    // TheMovieDB, except those already on the list by title and year, which
    // would only be looked up to be skipped.
    const { matched, unmatched } = matchLetterboxdRows(
      rows,
      Object.values(movies),
    );
    const listedKeys = new Set(
      Object.values(listed).map((entry) =>
        getTitleYearKey(entry.title, entry.year),
      ),
    );
    const toLookUp = unmatched.filter(
      (row) => !listedKeys.has(getTitleYearKey(row.title, row.year)),
    );

    const entries: Record<string, UserListEntry> = {};
    const alreadyListedIds = new Set<string>();
    const add = (id: string, entry: UserListEntry) => {
      if (id in listed) {
        alreadyListedIds.add(id);
        return;
      }
      // Two titles can find one film; it's kept at its earliest date.
      const existing = entries[id];
      if (!existing || existing.addedAt > entry.addedAt) entries[id] = entry;
    };
    for (const [id, entry] of Object.entries(matched)) add(id, entry);

    let missing: LetterboxdRow[] = [];
    if (toLookUp.length > 0) {
      const controller = new AbortController();
      lookupRef.current = controller;
      setState({
        step: "looking-up",
        listId,
        fileName: file.name,
        total: toLookUp.length,
        done: 0,
      });
      try {
        const lookup = await lookUpRowsOnTmdb(toLookUp, {
          getIdToken,
          signal: controller.signal,
          onProgress: (done) =>
            setState((current) =>
              current.step === "looking-up" ? { ...current, done } : current,
            ),
        });
        const now = Date.now();
        for (const { row, film } of lookup.found) {
          // A film TMDB found that the dataset has after all is the
          // dataset's, as its page would add it.
          add(film.id, {
            ...toUserListEntry(movies[film.id] ?? film),
            addedAt: row.date ?? now,
          });
        }
        missing = lookup.missing;
      } catch {
        if (controller.signal.aborted) return;
        setState({
          step: "error",
          message:
            "We couldn't reach TheMovieDB to look up the films that aren't showing, so nothing has been added. Please try again later.",
        });
        return;
      } finally {
        lookupRef.current = null;
      }
    }

    setState({
      step: "review",
      listId,
      fileName: file.name,
      total: rows.length,
      entries,
      showing: Object.keys(entries).filter((id) => movies[id]).length,
      alreadyListed:
        alreadyListedIds.size + (unmatched.length - toLookUp.length),
      missing,
    });
  };

  const onCancelLookup = () => {
    lookupRef.current?.abort();
    setState({ step: "idle" });
  };

  const onConfirm = async () => {
    if (state.step !== "review") return;
    setState({ ...state, step: "importing" });
    try {
      const added = await importToList(state.listId, state.entries);
      setState({ step: "done", listId: state.listId, count: added.length });
    } catch {
      setState({
        step: "error",
        message: "Something went wrong saving those films. Please try again.",
      });
    }
  };

  const reviewing = state.step === "review" || state.step === "importing";
  const busy = reviewing || state.step === "looking-up";

  // The review is a sibling of the section rather than inside it, so it can
  // take the panel's full width below import and export — a long file's
  // titles run to many lines in half of it.
  return (
    <>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Import from Letterboxd</h3>
        <p className={styles.managementText}>
          In Letterboxd, export your data from{" "}
          <a
            href="https://letterboxd.com/settings/data/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Settings → Data
          </a>{" "}
          and unzip it. Add{" "}
          <code>{LETTERBOXD_FILES[UserListId.Watchlist]}</code> to your
          Watchlist and <code>{LETTERBOXD_FILES[UserListId.Seen]}</code> to
          Seen. Films that aren&apos;t showing are looked up on TheMovieDB,
          which takes about a minute for every 200.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={onFile}
        />
        <div className={styles.managementActions}>
          {[UserListId.Watchlist, UserListId.Seen].map((listId) => (
            <Button
              key={listId}
              variant="secondary"
              size="sm"
              disabled={!ready || busy}
              onClick={() => choose(listId)}
            >
              Import to {LIST_NAMES[listId]}
            </Button>
          ))}
        </div>
        {state.step === "done" && (
          <p className={styles.managementStatus} role="status">
            {state.count === 0
              ? "Nothing new to add."
              : `Added ${plural(state.count, "film")} to your ${LIST_NAMES[state.listId]}.`}
          </p>
        )}
        {state.step === "error" && (
          <p className={styles.error} role="alert">
            {state.message}
          </p>
        )}
      </section>
      {state.step === "looking-up" && (
        <ImportProgress state={state} onCancel={onCancelLookup} />
      )}
      {reviewing && (
        <ImportReview
          state={state}
          onConfirm={onConfirm}
          onCancel={() => setState({ step: "idle" })}
        />
      )}
    </>
  );
}

/**
 * Where a long lookup has got to. It's paced to the Worker's rate limit, so a
 * big file takes minutes, and says so.
 */
function ImportProgress({
  state,
  onCancel,
}: {
  state: Extract<ImportState, { step: "looking-up" }>;
  onCancel: () => void;
}) {
  const minutes = estimateLookupMinutes(state.total - state.done);
  return (
    <div className={styles.importReview}>
      <p className={styles.managementText} role="status">
        Looking up {plural(state.total, "film")} that{" "}
        {state.total === 1 ? "isn't" : "aren't"} showing on TheMovieDB:{" "}
        {state.done.toLocaleString("en-GB")} done, about{" "}
        {plural(minutes, "minute")} to go. Keep this page open.
      </p>
      <progress
        className={styles.importProgress}
        value={state.done}
        max={state.total}
        aria-label="Films looked up"
      />
      <div className={styles.managementActions}>
        <Button variant="link" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ImportReview({
  state,
  onConfirm,
  onCancel,
}: {
  state: Extract<ImportState, { step: "review" | "importing" }>;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { lists } = useUserContext();
  const { movies } = useCinemaData();
  const titles = Object.entries(state.entries)
    .map(([id, entry]) => ({
      id,
      title: entry.title,
      href: movies[id] ? getMovieUrl({ id, title: entry.title }) : undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const listName = LIST_NAMES[state.listId];
  // Marking seen takes a film off the watchlist, and a bulk import shouldn't
  // do that unannounced.
  const leavingWatchlist =
    state.listId === UserListId.Seen && lists
      ? Object.keys(state.entries).filter(
          (id) => id in lists[UserListId.Watchlist],
        ).length
      : 0;

  const count = titles.length;
  const already = state.alreadyListed;
  // Said only when some are, and without "of them" for a single film.
  const showingNote =
    state.showing === 0
      ? ""
      : count === 1
        ? ", and it's showing now"
        : `, ${state.showing.toLocaleString("en-GB")} of them showing now`;
  const summary = [
    `${state.fileName} lists ${plural(state.total, "film")}${already > 0 ? `, ${already.toLocaleString("en-GB")} of them already on your ${listName}` : ""}.`,
    count > 0
      ? `${plural(count, "film")} ${count === 1 ? "isn't" : "aren't"} on ${already > 0 ? "it" : `your ${listName}`} yet${showingNote}:`
      : already === 0
        ? "We couldn't find any of them."
        : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.importReview}>
      <p className={styles.managementText}>{summary}</p>
      {count > 0 && <ReviewTitles films={titles} />}
      {state.missing.length > 0 && (
        <details className={styles.importMissing}>
          <summary>
            We couldn&apos;t find {plural(state.missing.length, "film")} on
            TheMovieDB
          </summary>
          <p className={styles.importTitles}>
            {state.missing
              .map(({ title, year }) => (year ? `${title} (${year})` : title))
              .join(", ")}
          </p>
          <p className={styles.managementText}>
            Try searching for {state.missing.length === 1 ? "it" : "them"} under
            Add a film: the title may differ from Letterboxd&apos;s.
          </p>
        </details>
      )}
      {leavingWatchlist > 0 && (
        <p className={styles.managementText}>
          {plural(leavingWatchlist, "film")} will come off your Watchlist, as
          marking a film seen does.
        </p>
      )}
      <div className={styles.managementActions}>
        {count > 0 ? (
          <>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={state.step === "importing"}
            >
              {state.step === "importing"
                ? "Adding…"
                : `Add ${plural(count, "film")} to ${listName}`}
            </Button>
            <Button
              variant="link"
              onClick={onCancel}
              disabled={state.step === "importing"}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            OK
          </Button>
        )}
      </div>
    </div>
  );
}

function ExportSection() {
  const { lists } = useUserContext();
  const { movies } = useCinemaData();

  const onExport = (listId: UserListId) => {
    if (!lists) return;
    // An unmatched film's id is the pipeline's own, not TheMovieDB's. For a
    // film that has left the dataset there's no telling, so an id is trusted
    // if it's numeric, as TheMovieDB's are.
    const isTmdbId = (id: string) =>
      /^\d+$/.test(id) && !movies[id]?.isUnmatched;
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(
      `clusterflick-${listId}-${date}.csv`,
      formatLetterboxdCsv(lists[listId], isTmdbId),
    );
  };

  return (
    <section className={styles.managementSection}>
      <h3 className={styles.managementTitle}>Export from Clusterflick</h3>
      <p className={styles.managementText}>
        A CSV of each list, in the format{" "}
        <a
          href="https://letterboxd.com/import/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Letterboxd imports
        </a>
        , which can come back in here too.
      </p>
      <div className={styles.managementActions}>
        {[UserListId.Watchlist, UserListId.Seen].map((listId) => {
          const count = lists ? Object.keys(lists[listId]).length : 0;
          return (
            <Button
              key={listId}
              variant="secondary"
              size="sm"
              disabled={count === 0}
              onClick={() => onExport(listId)}
            >
              Download {LIST_NAMES[listId]} ({count.toLocaleString("en-GB")})
            </Button>
          );
        })}
      </div>
    </section>
  );
}

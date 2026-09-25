"use client";

import { Fragment, useRef, useState, type ChangeEvent } from "react";
import Button from "@/components/button";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { UserListId, type UserListEntry } from "@/lib/user-lists";
import {
  formatLetterboxdCsv,
  LetterboxdCsvError,
  matchLetterboxdRows,
  parseLetterboxdCsv,
} from "@/lib/user-lists/letterboxd-csv";
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

type ImportState =
  | { step: "idle" }
  | {
      step: "review" | "importing";
      listId: UserListId;
      fileName: string;
      /** Films the file names. */
      total: number;
      /** Those showing now and not already on the list. */
      entries: Record<string, UserListEntry>;
      /** Showing now but on the list already. */
      alreadyListed: number;
    }
  | { step: "done"; listId: UserListId; count: number }
  | { step: "error"; message: string };

function plural(count: number, noun: string) {
  return `${count.toLocaleString("en-GB")} ${noun}${count === 1 ? "" : "s"}`;
}

/**
 * The films an import would add, each linked to its page. In a new tab, so
 * checking one doesn't lose the review — which lives only in this page's state.
 */
function ReviewTitles({ films }: { films: { id: string; title: string }[] }) {
  const shown = films.slice(0, REVIEW_TITLE_LIMIT);
  const rest = films.length - shown.length;
  return (
    <p className={styles.importTitles}>
      {shown.map((film, index) => (
        <Fragment key={film.id}>
          {index > 0 && ", "}
          <a href={getMovieUrl(film)} target="_blank" rel="noopener noreferrer">
            {film.title}
          </a>
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
 * Importing from and exporting to Letterboxd, and whether the lists show their
 * Remove buttons. Tucked under the account bar: all of it is occasional.
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
    </div>
  );
}

function ImportSection() {
  const { lists, importToList } = useUserContext();
  const { movies, hasAttemptedLoad, isLoading, error } = useCinemaData();
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<UserListId>(UserListId.Watchlist);
  // Matching is against what's showing, so it waits for the data.
  const ready = !!lists && hasAttemptedLoad && !isLoading && !error;
  const busy = state.step === "importing";

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
    try {
      const rows = parseLetterboxdCsv(await file.text());
      const matched = matchLetterboxdRows(rows, Object.values(movies));
      const listed = lists[listId];
      const entries = Object.fromEntries(
        Object.entries(matched).filter(([id]) => !(id in listed)),
      );
      setState({
        step: "review",
        listId,
        fileName: file.name,
        total: rows.length,
        entries,
        alreadyListed:
          Object.keys(matched).length - Object.keys(entries).length,
      });
    } catch (caught) {
      setState({
        step: "error",
        message:
          caught instanceof LetterboxdCsvError
            ? `${file.name} doesn't look like a Letterboxd export — it has no Name or Title column.`
            : `We couldn't read ${file.name}.`,
      });
    }
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

  return (
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
        and unzip it. Add <code>{LETTERBOXD_FILES[UserListId.Watchlist]}</code>{" "}
        to your Watchlist and <code>{LETTERBOXD_FILES[UserListId.Seen]}</code>{" "}
        to Seen. We add the films that are showing in London now.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={onFile}
      />
      {state.step === "review" || state.step === "importing" ? (
        <ImportReview
          state={state}
          onConfirm={onConfirm}
          onCancel={() => setState({ step: "idle" })}
        />
      ) : (
        <>
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
        </>
      )}
    </section>
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
  const titles = Object.entries(state.entries)
    .map(([id, entry]) => ({ id, title: entry.title }))
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

  const summary = [
    `${state.fileName} lists ${plural(state.total, "film")}.`,
    titles.length === 0 && state.alreadyListed === 0
      ? "None of them are showing in London right now."
      : titles.length === 0
        ? `The ${plural(state.alreadyListed, "film")} showing now ${state.alreadyListed === 1 ? "is" : "are"} already on your ${listName}.`
        : `${plural(titles.length, "film")} showing now ${titles.length === 1 ? "isn't" : "aren't"} on your ${listName} yet${state.alreadyListed > 0 ? ` (${state.alreadyListed.toLocaleString("en-GB")} more already ${state.alreadyListed === 1 ? "is" : "are"})` : ""}:`,
  ].join(" ");

  return (
    <div className={styles.importReview}>
      <p className={styles.managementText}>{summary}</p>
      {titles.length > 0 && <ReviewTitles films={titles} />}
      {leavingWatchlist > 0 && (
        <p className={styles.managementText}>
          {plural(leavingWatchlist, "film")} will come off your Watchlist, as
          marking a film seen does.
        </p>
      )}
      <div className={styles.managementActions}>
        {titles.length > 0 ? (
          <>
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={state.step === "importing"}
            >
              {state.step === "importing"
                ? "Adding…"
                : `Add ${plural(titles.length, "film")} to ${listName}`}
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

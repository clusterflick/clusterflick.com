"use client";

import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import clsx from "clsx";
import MoviePoster from "@/components/movie-poster";
import Button from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import SearchInput from "@/components/search-input";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserContext } from "@/state/user-context";
import { normalizeForSearch } from "@/lib/filters/normalize";
import { UserListId } from "@/lib/user-lists";
import {
  searchTmdb,
  TmdbSearchError,
  type TmdbSearchResult,
} from "@/lib/tmdb-search";
import {
  FAVOURITES_MAX,
  toFavouriteFilm,
  type FavouriteFilm,
} from "@/lib/user-profile";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

/** How many matches are drawn at once: two rows; past that, another word. */
const RESULT_LIMIT = 12;

/** Below this many characters (once folded), a query matches too much. */
const MIN_QUERY_LENGTH = 2;

type TmdbState =
  | { step: "idle" }
  | { step: "searching"; query: string }
  | { step: "done"; query: string; results: TmdbSearchResult[] }
  | { step: "error"; query: string; message: string };

/** A film that could be picked, from the Seen list or TheMovieDB. */
type Candidate = FavouriteFilm & { onSeen: boolean };

/** Moves one item of a list to another place in it. */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Up to four films to head the profile, in the reader's order, as part of
 * the settings' one draft.
 *
 * The four places are drawn whether filled or not: an empty one opens the
 * search, a filled one can be dragged to another place, or moved with its
 * arrows, which are also the keyboard's way to do it.
 *
 * Films are picked from the Seen list first, searched as the reader types,
 * since that is almost always where favourites are, and nothing leaves the
 * browser for it. TheMovieDB is the second step, as in the film search on
 * /personalise: on Enter or "Search all films", never as the reader types,
 * since every request counts against the search Worker's per-reader limit.
 * Each pick is its own snapshot, so the Seen list can change without
 * touching it.
 */
export default function FavouritesPicker({
  value: picks,
  onChange,
}: {
  value: FavouriteFilm[];
  onChange: (favourites: FavouriteFilm[]) => void;
}) {
  const { lists, getIdToken } = useUserContext();
  const { movies } = useCinemaData();
  const [query, setQuery] = useState("");
  const [tmdb, setTmdb] = useState<TmdbState>({ step: "idle" });
  const inFlight = useRef<AbortController | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);

  const trimmed = query.trim();
  const deferredQuery = useDeferredValue(trimmed);
  const folded = normalizeForSearch(deferredQuery);
  const searchable = folded.length >= MIN_QUERY_LENGTH;

  // The Seen list's matches, those whose title starts with the query first.
  // A poster is the dataset's where the film is still in it, being possibly
  // newer than the list's snapshot.
  const seenMatches = useMemo<Candidate[]>(() => {
    if (!searchable || !lists) return [];
    return Object.entries(lists[UserListId.Seen])
      .map(([id, entry]) => ({
        id,
        entry,
        title: normalizeForSearch(entry.title),
      }))
      .filter(({ title }) => title.includes(folded))
      .sort(
        (a, b) =>
          Number(b.title.startsWith(folded)) -
            Number(a.title.startsWith(folded)) ||
          a.entry.title.localeCompare(b.entry.title),
      )
      .flatMap(({ id, entry }) => {
        const film = toFavouriteFilm(id, {
          ...entry,
          posterPath: movies[id]?.posterPath ?? entry.posterPath,
        });
        return film ? [{ ...film, onSeen: true }] : [];
      });
  }, [searchable, lists, folded, movies]);

  // TheMovieDB's answer belongs to the query it was asked.
  const tmdbCurrent = tmdb.step !== "idle" && tmdb.query === trimmed;
  const allFilms = tmdbCurrent && tmdb.step === "done";
  const searching = tmdbCurrent && tmdb.step === "searching";
  const shownSeen = seenMatches.slice(0, RESULT_LIMIT);
  const seenIds = new Set(shownSeen.map(({ id }) => id));
  const tmdbMatches: Candidate[] = allFilms
    ? tmdb.results.flatMap((result) => {
        if (seenIds.has(result.id)) return [];
        const film = toFavouriteFilm(result.id, result);
        return film ? [{ ...film, onSeen: false }] : [];
      })
    : [];
  const candidates = [...shownSeen, ...tmdbMatches];

  const searchAll = async () => {
    if (!trimmed) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setTmdb({ step: "searching", query: trimmed });
    try {
      const { results } = await searchTmdb(
        trimmed,
        getIdToken,
        controller.signal,
      );
      setTmdb({ step: "done", query: trimmed, results });
    } catch (searchError) {
      if (controller.signal.aborted) return;
      setTmdb({
        step: "error",
        query: trimmed,
        message:
          searchError instanceof TmdbSearchError
            ? searchError.message
            : "We couldn't reach the server. Check your connection and try again.",
      });
      if (!(searchError instanceof TmdbSearchError)) {
        console.error("Favourite search failed", searchError);
      }
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    searchAll();
  };

  const pickedIds = new Set(picks.map(({ id }) => id));
  const full = picks.length >= FAVOURITES_MAX;

  // Saved without `onSeen`, which only says where a candidate was found.
  const add = (candidate: Candidate) => {
    const film = toFavouriteFilm(candidate.id, candidate);
    if (!film || full || pickedIds.has(film.id)) return;
    onChange([...picks, film]);
  };
  const remove = (id: string) =>
    onChange(picks.filter((film) => film.id !== id));
  const move = (from: number, to: number) =>
    onChange(moveItem(picks, from, to));

  // Dropped on a filled place, the film takes it; on an empty one, it goes
  // last, as there's nothing after it to sit before.
  const onDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragging !== null && dragging !== index) {
      move(dragging, Math.min(index, picks.length - 1));
    }
    setDragging(null);
    setDropTarget(null);
  };

  const focusSearch = () => {
    searchRef.current?.focus();
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <ol className={styles.slots} aria-label="Your favourite films, in order">
        {Array.from({ length: FAVOURITES_MAX }, (_, index) => {
          const film = picks[index];
          const dropProps = {
            onDragOver: (event: DragEvent) => {
              if (dragging === null) return;
              event.preventDefault();
              setDropTarget(index);
            },
            onDragLeave: () =>
              setDropTarget((current) => (current === index ? null : current)),
            onDrop: (event: DragEvent) => onDrop(event, index),
          };
          if (!film) {
            return (
              <li
                key={`empty-${index}`}
                className={clsx(
                  styles.slot,
                  dropTarget === index && styles.slotTarget,
                )}
                {...dropProps}
              >
                <button
                  type="button"
                  className={styles.slotEmpty}
                  onClick={focusSearch}
                >
                  <span className={styles.slotPlus} aria-hidden="true">
                    +
                  </span>
                  {index === picks.length ? "Add a film" : "Empty"}
                </button>
              </li>
            );
          }
          return (
            <li
              key={film.id}
              className={clsx(
                styles.slot,
                dragging === index && styles.slotDragging,
                dropTarget === index && styles.slotTarget,
              )}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                setDragging(index);
              }}
              onDragEnd={() => {
                setDragging(null);
                setDropTarget(null);
              }}
              {...dropProps}
            >
              <div className={styles.slotPoster}>
                <MoviePoster
                  title={film.title}
                  posterPath={film.posterPath}
                  showOverlay={!film.posterPath}
                  interactive={false}
                  fluid
                  headingLevel="h3"
                />
                <span className={styles.slotRank} aria-hidden="true">
                  {index + 1}
                </span>
              </div>
              <p className={styles.slotTitle}>{film.title}</p>
              <div className={styles.slotControls}>
                <button
                  type="button"
                  className={styles.slotButton}
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label={`Move ${film.title} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  className={styles.slotButton}
                  onClick={() => move(index, index + 1)}
                  disabled={index === picks.length - 1}
                  aria-label={`Move ${film.title} later`}
                >
                  →
                </button>
                <button
                  type="button"
                  className={styles.slotButton}
                  onClick={() => remove(film.id)}
                  aria-label={`Remove ${film.title}`}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <form
        role="search"
        className={styles.favouriteSearch}
        onSubmit={onSubmit}
      >
        <SearchInput
          id="profile-favourite-search"
          inputRef={searchRef}
          value={query}
          onChange={(value) => {
            setQuery(value);
            if (!value) {
              inFlight.current?.abort();
              setTmdb({ step: "idle" });
            }
          }}
          placeholder={
            full
              ? "Remove one to add another"
              : "Search your Seen list to add a film"
          }
          ariaLabel="Search for a favourite film"
        />
      </form>

      {(searchable || tmdbCurrent) && (
        <div aria-live="polite" className={styles.favouriteResults}>
          <div className={styles.favouriteResultsHeader}>
            <h3 className={personaliseStyles.groupTitle}>
              {allFilms ? "All films" : "From your Seen list"}
            </h3>
            {allFilms ? (
              <span className={personaliseStyles.confirmText}>
                Your Seen list first
              </span>
            ) : (
              <span className={styles.favouriteSearchAll}>
                <span className={personaliseStyles.confirmText}>
                  {searching ? "Searching all films…" : "Not seen it here?"}
                </span>
                {!searching && (
                  <Button variant="secondary" size="sm" onClick={searchAll}>
                    Search all films
                  </Button>
                )}
              </span>
            )}
          </div>
          {candidates.length > 0 ? (
            <PosterTileList>
              {candidates.map((film) => (
                <PosterTile
                  key={film.id}
                  title={film.title}
                  posterPath={film.posterPath}
                  details={[
                    ...(film.year ? [film.year] : []),
                    ...(allFilms && film.onSeen ? ["Seen"] : []),
                  ]}
                  action={
                    <Button
                      size="sm"
                      onClick={() => add(film)}
                      disabled={full || pickedIds.has(film.id)}
                    >
                      {pickedIds.has(film.id)
                        ? "Added"
                        : full
                          ? `${FAVOURITES_MAX} picked`
                          : "Add"}
                    </Button>
                  }
                />
              ))}
            </PosterTileList>
          ) : searching ? (
            <LoadingIndicator message="Searching all films…" size="sm" />
          ) : (
            <p className={personaliseStyles.managementText}>
              {allFilms ? (
                <>
                  No films match <strong>{trimmed}</strong>.
                </>
              ) : (
                <>
                  Nothing on your Seen list matches{" "}
                  <strong>{deferredQuery}</strong>.
                </>
              )}
            </p>
          )}
          {seenMatches.length > shownSeen.length && (
            <p className={personaliseStyles.managementText}>
              {seenMatches.length} films on your Seen list match: add a word to
              narrow it.
            </p>
          )}
          {tmdbCurrent && tmdb.step === "error" && (
            <p className={personaliseStyles.error} role="alert">
              {tmdb.message}
            </p>
          )}
        </div>
      )}
    </>
  );
}

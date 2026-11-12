"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
  sameFavourites,
  toFavouriteFilm,
  type FavouriteFilm,
} from "@/lib/user-profile";
import { useProfileSave } from "@/app/personalise/public-profile";
import personaliseStyles from "@/app/personalise/page.module.css";
import Step, { type StepProps } from "./step";
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

/**
 * Up to four films to head the profile, in the reader's order.
 *
 * Picked from the Seen list first, searched as the reader types, since that
 * is almost always where favourites are; nothing leaves the browser for it.
 * TheMovieDB is the second step, as in the film search on /personalise: on
 * Enter or "Search all films", never as the reader types, since every
 * request counts against the search Worker's per-reader limit. Each pick is
 * saved as its own snapshot, so the Seen list can change without touching
 * it.
 */
export default function FavouritesStep({
  number,
  profile,
  onSaved,
  onFavouritesChange,
}: StepProps & {
  number: number;
  onFavouritesChange: (favourites: FavouriteFilm[]) => void;
}) {
  const { lists, getIdToken } = useUserContext();
  const { movies } = useCinemaData();
  const { save, saving, error } = useProfileSave(profile, onSaved);
  const saved = useMemo(() => profile?.favourites ?? [], [profile]);
  const [picks, setPicks] = useState<FavouriteFilm[]>(saved);
  const [query, setQuery] = useState("");
  const [tmdb, setTmdb] = useState<TmdbState>({ step: "idle" });
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    onFavouritesChange(picks);
  }, [picks, onFavouritesChange]);

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
  const changed = !sameFavourites(picks, saved);
  const blockedBySections = Boolean(profile?.public && !profile.sections);

  const move = (index: number, by: -1 | 1) =>
    setPicks((current) => {
      const next = [...current];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  // Saved without `onSeen`, which only says where a candidate was found.
  const add = (candidate: Candidate) => {
    const film = toFavouriteFilm(candidate.id, candidate);
    if (!film) return;
    setPicks((current) =>
      current.length >= FAVOURITES_MAX ||
      current.some(({ id }) => id === film.id)
        ? current
        : [...current, film],
    );
  };

  return (
    <Step number={number} title="Favourite films">
      <p className={personaliseStyles.managementText}>
        Optional. Up to {FAVOURITES_MAX} films to head your profile, in your
        order. Pick from what you&apos;ve seen, or search every film.
      </p>

      <PosterTileList className={styles.favouritePicks}>
        {Array.from({ length: FAVOURITES_MAX }, (_, index) => {
          const film = picks[index];
          if (!film) {
            return (
              <li key={`empty-${index}`} className={styles.favouriteEmpty}>
                {index === picks.length ? "Search below to add one" : ""}
              </li>
            );
          }
          return (
            <PosterTile
              key={film.id}
              title={film.title}
              posterPath={film.posterPath}
              details={film.year ? [film.year] : undefined}
              action={
                <div className={styles.favouriteActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${film.title} earlier`}
                  >
                    ←
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => move(index, 1)}
                    disabled={index === picks.length - 1}
                    aria-label={`Move ${film.title} later`}
                  >
                    →
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setPicks((current) =>
                        current.filter(({ id }) => id !== film.id),
                      )
                    }
                    aria-label={`Remove ${film.title}`}
                  >
                    Remove
                  </Button>
                </div>
              }
            />
          );
        })}
      </PosterTileList>

      <form
        role="search"
        className={styles.favouriteSearch}
        onSubmit={onSubmit}
      >
        <SearchInput
          id="profile-favourite-search"
          value={query}
          onChange={(value) => {
            setQuery(value);
            if (!value) {
              inFlight.current?.abort();
              setTmdb({ step: "idle" });
            }
          }}
          placeholder="Search your Seen list"
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

      <div className={personaliseStyles.managementActions}>
        <Button
          size="sm"
          onClick={() => profile && save({ ...profile, favourites: picks })}
          disabled={!profile || saving || !changed || blockedBySections}
        >
          Save favourites
        </Button>
        {!profile ? (
          <span className={personaliseStyles.confirmText}>
            Save a handle first.
          </span>
        ) : blockedBySections ? (
          <span className={personaliseStyles.confirmText}>
            Choose what your profile shows first, below.
          </span>
        ) : changed && saved.length > 0 ? (
          <Button variant="link" onClick={() => setPicks(saved)}>
            Undo changes
          </Button>
        ) : (
          !changed &&
          saved.length > 0 && (
            <span className={personaliseStyles.confirmText}>Saved</span>
          )
        )}
      </div>
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </Step>
  );
}

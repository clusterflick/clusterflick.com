"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import { CinemaData, MetaData } from "@/types";
import { getLondonMidnightTimestamp } from "@/utils/format-date";
import { hydrateUrl as hydrateUrlWithPrefixes } from "@/utils/hydrate-url";
import { pruneByPerformances } from "@/utils/prune-movies";
import { fetchWithRetry, FetchRetryError } from "@/utils/fetch-with-retry";

/**
 * Custom error class for data fetching errors with additional context.
 */
export class DataFetchError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "DataFetchError";
  }
}

type ContextType = {
  metaData: MetaData | null;
  movies: CinemaData["movies"];
  isLoading: boolean;
  isEmpty: boolean;
  hasAttemptedLoad: boolean;
  error: DataFetchError | null;
  /**
   * Movie chunks that still failed after every retry. The load carries on
   * without them, so the dataset is missing a run of titles (chunks are cut in
   * title order) — anything reading a film's absence as "not showing" must
   * check this first.
   */
  failedFiles: string[];
  /** Whether `retryFailedFiles` is refetching them. */
  isRetryingFailedFiles: boolean;
  getData: () => Promise<void>;
  getDataWithPriority: (movieId: string) => Promise<void>;
  hydrateUrl: (truncatedUrl: string) => string;
  retry: () => Promise<void>;
  /**
   * Refetch only the chunks in `failedFiles`, merging them into what is
   * already loaded. Unlike `retry` nothing on screen is cleared first.
   */
  retryFailedFiles: () => Promise<void>;
};

/**
 * Adds the `id` property to each item based on its key.
 * Note: Intentionally mutates the input for performance - this is only called
 * on freshly fetched data before it enters React state.
 */
function expandData<T extends Record<string, { id: string }>>(data: T): T {
  Object.keys(data).forEach((id: string) => {
    data[id].id = id;
  });
  return data;
}

const UNCATEGORISED_GENRE_ID = "uncategorised";

/**
 * Find or create the "Uncategorised" genre in the genres metadata.
 * Note: Intentionally mutates the input for performance - this is only called
 * on freshly fetched data before it enters React state.
 */
function ensureUncategorisedGenre(
  genres: Record<string, { id: string; name: string }>,
): string {
  // First, check if it already exists
  for (const genre of Object.values(genres)) {
    if (genre.name === "Uncategorised") {
      return genre.id;
    }
  }

  // If not found, create it
  genres[UNCATEGORISED_GENRE_ID] = {
    id: UNCATEGORISED_GENRE_ID,
    name: "Uncategorised",
  };
  return UNCATEGORISED_GENRE_ID;
}

/**
 * Assign "Uncategorised" genre to movies that have no genres,
 * or whose genres don't exist in the metadata.
 * Note: Intentionally mutates the input for performance - this is only called
 * on freshly fetched data before it enters React state.
 */
function assignUncategorisedGenre(
  movies: CinemaData["movies"],
  uncategorisedGenreId: string,
  validGenreIds: Set<string>,
): CinemaData["movies"] {
  for (const movie of Object.values(movies)) {
    if (!movie.genres || movie.genres.length === 0) {
      // No genres at all
      movie.genres = [uncategorisedGenreId];
    } else {
      // Check if any of the movie's genres are valid (exist in metadata)
      const hasValidGenre = movie.genres.some((id) => validGenreIds.has(id));
      if (!hasValidGenre) {
        // All genre IDs are invalid/orphaned, add uncategorised
        movie.genres = [...movie.genres, uncategorisedGenreId];
      }
    }
  }
  return movies;
}

/**
 * Remove performances before today, then prune any showings and movies
 * that have no remaining performances. This ensures stale data never
 * enters React state regardless of which filters are active.
 */
function stripPastPerformances(
  movies: CinemaData["movies"],
): CinemaData["movies"] {
  const todayMidnight = getLondonMidnightTimestamp();
  return pruneByPerformances(movies, (perf) => perf.time >= todayMidnight);
}

/**
 * Turn a fetch that failed every retry into the error the pages show. A status
 * means the server answered and refused; no status means the request never got
 * an answer (offline, dropped, timed out) or the body could not be parsed.
 */
function toDataFetchError(err: unknown, what: string): DataFetchError {
  if (err instanceof FetchRetryError && err.status !== undefined) {
    return new DataFetchError(
      `Failed to load ${what}: Server returned ${err.status}`,
      err,
      err.status,
    );
  }
  if (err instanceof FetchRetryError && err.cause instanceof SyntaxError) {
    return new DataFetchError(`Data error: Failed to parse ${what}`, err);
  }
  return new DataFetchError(
    "Network error: Unable to connect to the server. Please check your internet connection.",
    err,
  );
}

export async function getMetaData(): Promise<MetaData> {
  const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;

  if (!metaFilename) {
    throw new DataFetchError(
      "Configuration error: NEXT_PUBLIC_DATA_FILENAME is not set",
    );
  }

  let metaData: MetaData;
  try {
    metaData = await fetchWithRetry(`/data/${metaFilename}`, (response) =>
      response.json(),
    );
  } catch (err) {
    throw toDataFetchError(err, "metadata");
  }

  return {
    ...metaData,
    genres: expandData<CinemaData["genres"]>(metaData.genres),
    people: expandData<CinemaData["people"]>(metaData.people),
    venues: expandData<CinemaData["venues"]>(metaData.venues),
    collections: expandData<CinemaData["collections"]>(metaData.collections),
  };
}

export async function getMovieData(
  filename: string,
): Promise<CinemaData["movies"]> {
  let movies: CinemaData["movies"];
  try {
    movies = await fetchWithRetry(`/data/${filename}`, (response) =>
      response.json(),
    );
  } catch (err) {
    throw toDataFetchError(err, `movie data from ${filename}`);
  }

  return expandData<CinemaData["movies"]>(movies);
}

const Context = createContext<ContextType | undefined>(undefined);

/**
 * Build the per-chunk step that strips past performances, fills in the
 * "Uncategorised" genre and merges the chunk into state. Shared by the first
 * load and by `retryFailedFiles`, so a recovered chunk is processed exactly as
 * it would have been had it arrived first time.
 */
function createChunkProcessor(
  metaData: MetaData,
  updateMovies: (movies: CinemaData["movies"]) => void,
) {
  // Idempotent: finds the genre by name once it exists
  const uncategorisedId = ensureUncategorisedGenre(metaData.genres);
  const validGenreIds = new Set(Object.keys(metaData.genres));

  return (newMovies: CinemaData["movies"]) => {
    const withoutPast = stripPastPerformances(newMovies);
    const processed = assignUncategorisedGenre(
      withoutPast,
      uncategorisedId,
      validGenreIds,
    );
    updateMovies(processed);
  };
}

/**
 * Fetch each chunk, merging it as it arrives, and return the ones that failed
 * every retry. Settled rather than `Promise.all`, so one bad chunk never stops
 * the rest from loading.
 */
async function loadChunks(
  filenames: string[],
  processChunk: (movies: CinemaData["movies"]) => void,
): Promise<string[]> {
  const results = await Promise.allSettled(
    filenames.map((filename) => getMovieData(filename).then(processChunk)),
  );

  const failed: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected") failed.push(filenames[index]);
  });
  if (failed.length > 0) {
    console.error(
      `Failed to load ${failed.length} data file(s):`,
      results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => r.reason),
    );
  }
  return failed;
}

export function CinemaDataProvider({ children }: { children: ReactNode }) {
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [movies, setMovies] = useState<CinemaData["movies"]>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState<boolean>(false);
  const [error, setError] = useState<DataFetchError | null>(null);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);
  const [isRetryingFailedFiles, setIsRetryingFailedFiles] = useState(false);

  // Ref for synchronous loading check to prevent race conditions
  // State updates are async, so rapid calls could both pass the isLoading check
  // before the first one sets isLoading to true
  const isLoadingRef = useRef(false);

  const hydrateUrl = useCallback(
    (truncatedUrl: string) => {
      if (!metaData) return truncatedUrl;
      return hydrateUrlWithPrefixes(truncatedUrl, metaData.urlPrefixes);
    },
    [metaData],
  );

  const updateMovies = useCallback((newMovies: CinemaData["movies"]) => {
    setMovies((state) => ({ ...state, ...newMovies }));
  }, []);

  /**
   * Core loading function that fetches metadata and movie data.
   * Extracted to avoid duplication between getDataWithPriority and retry.
   */
  const loadData = useCallback(
    async (movieId?: string) => {
      isLoadingRef.current = true;
      setIsLoading(true);
      setHasAttemptedLoad(true);
      setError(null);
      setFailedFiles([]);

      try {
        // Get the meta data first
        const metaData = await getMetaData();
        setMetaData(metaData);

        const processChunk = createChunkProcessor(metaData, updateMovies);

        // Find the filename for the prioritised movie
        // If no movieId is provided, no matching filename will be found
        let filenameKey: number | undefined;
        for (const [key, movieIds] of Object.entries(metaData.mapping)) {
          if (movieId && movieIds.includes(movieId)) {
            filenameKey = parseInt(key, 10);
            break;
          }
        }
        let prioritisedFilename: string | undefined;
        if (filenameKey !== undefined) {
          prioritisedFilename = metaData.filenames[filenameKey];
          await getMovieData(prioritisedFilename).then(processChunk);
        }

        // Get the remaining data files, carrying on past any that fail
        const remaining = metaData.filenames.filter(
          (filename: string) => filename !== prioritisedFilename,
        );
        const failed = await loadChunks(remaining, processChunk);

        // Nothing loaded at all is an outage, not a gap — show the error
        // state rather than a notice over an empty page
        if (
          failed.length > 0 &&
          failed.length === remaining.length &&
          !prioritisedFilename
        ) {
          throw new DataFetchError(
            "Failed to load movie data. Please try again later.",
          );
        }
        setFailedFiles(failed);
      } catch (err) {
        const dataError =
          err instanceof DataFetchError
            ? err
            : new DataFetchError(
                "An unexpected error occurred while loading data",
                err,
              );
        setError(dataError);
        console.error("Data fetch error:", dataError);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [updateMovies],
  );

  const getDataWithPriority = useCallback(
    async (movieId?: string) => {
      // Use ref for synchronous check to prevent race conditions
      // State updates are async, so we check the ref which updates immediately
      if (isLoadingRef.current) return;
      if (Object.keys(movies).length > 0) return;

      await loadData(movieId);
    },
    [loadData, movies],
  );

  const getData = useCallback(async () => {
    // Reuse the priority function without providing a movieId to prioritise
    await getDataWithPriority();
  }, [getDataWithPriority]);

  const retry = useCallback(async () => {
    // Reset state and try again
    setError(null);
    setMovies({});
    setMetaData(null);
    await loadData();
  }, [loadData]);

  const retryFailedFiles = useCallback(async () => {
    if (!metaData || failedFiles.length === 0) return;
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsRetryingFailedFiles(true);

    try {
      const processChunk = createChunkProcessor(metaData, updateMovies);
      const stillFailed = await loadChunks(failedFiles, processChunk);
      setFailedFiles(stillFailed);
    } finally {
      isLoadingRef.current = false;
      setIsRetryingFailedFiles(false);
    }
  }, [metaData, failedFiles, updateMovies]);

  const isEmpty = useMemo(() => Object.keys(movies).length === 0, [movies]);

  const contextValue = useMemo(
    () => ({
      metaData,
      movies,
      isLoading,
      isEmpty,
      hasAttemptedLoad,
      error,
      failedFiles,
      isRetryingFailedFiles,
      getData,
      getDataWithPriority,
      hydrateUrl,
      retry,
      retryFailedFiles,
    }),
    [
      metaData,
      movies,
      isLoading,
      isEmpty,
      hasAttemptedLoad,
      error,
      failedFiles,
      isRetryingFailedFiles,
      getData,
      getDataWithPriority,
      hydrateUrl,
      retry,
      retryFailedFiles,
    ],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

export function useCinemaData() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useCinemaData must be used within a CinemaDataProvider");
  }
  return context;
}

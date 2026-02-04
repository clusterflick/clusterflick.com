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
import { decompress, Compressed } from "compress-json";

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
  error: DataFetchError | null;
  getData: () => Promise<void>;
  getDataWithPriority: (movieId: string) => Promise<void>;
  hydrateUrl: (truncatedUrl: string) => string;
  retry: () => Promise<void>;
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

export async function getMetaData(): Promise<MetaData> {
  const metaFilename = process.env.NEXT_PUBLIC_DATA_FILENAME;

  if (!metaFilename) {
    throw new DataFetchError(
      "Configuration error: NEXT_PUBLIC_DATA_FILENAME is not set",
    );
  }

  const url = `/data/${metaFilename}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch (err) {
    throw new DataFetchError(
      "Network error: Unable to connect to the server. Please check your internet connection.",
      err,
    );
  }

  if (!response.ok) {
    throw new DataFetchError(
      `Failed to load metadata: ${response.status} ${response.statusText}`,
      undefined,
      response.status,
    );
  }

  let compressed: Compressed;
  try {
    compressed = await response.json();
  } catch (err) {
    throw new DataFetchError(
      "Data error: Failed to parse metadata response",
      err,
    );
  }

  try {
    const metaData = decompress(compressed) as MetaData;
    return {
      ...metaData,
      genres: expandData<CinemaData["genres"]>(metaData.genres),
      people: expandData<CinemaData["people"]>(metaData.people),
      venues: expandData<CinemaData["venues"]>(metaData.venues),
    };
  } catch (err) {
    throw new DataFetchError("Data error: Failed to decompress metadata", err);
  }
}

export async function getMovieData(
  filename: string,
): Promise<CinemaData["movies"]> {
  const url = `/data/${filename}`;
  let response: Response;

  try {
    response = await fetch(url);
  } catch (err) {
    throw new DataFetchError(
      `Network error: Unable to fetch movie data from ${filename}`,
      err,
    );
  }

  if (!response.ok) {
    throw new DataFetchError(
      `Failed to load movie data: Server returned ${response.status} ${response.statusText}`,
      undefined,
      response.status,
    );
  }

  let compressed: Compressed;
  try {
    compressed = await response.json();
  } catch (err) {
    throw new DataFetchError(
      `Data error: Failed to parse movie data from ${filename}`,
      err,
    );
  }

  try {
    const movies = decompress(compressed) as CinemaData["movies"];
    return expandData<CinemaData["movies"]>(movies);
  } catch (err) {
    throw new DataFetchError(
      `Data error: Failed to decompress movie data from ${filename}`,
      err,
    );
  }
}

const Context = createContext<ContextType | undefined>(undefined);

export function CinemaDataProvider({ children }: { children: ReactNode }) {
  const [metaData, setMetaData] = useState<MetaData | null>(null);
  const [movies, setMovies] = useState<CinemaData["movies"]>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataFetchError | null>(null);

  // Ref for synchronous loading check to prevent race conditions
  // State updates are async, so rapid calls could both pass the isLoading check
  // before the first one sets isLoading to true
  const isLoadingRef = useRef(false);

  const hydrateUrl = useCallback(
    (truncatedUrl: string) => {
      if (!truncatedUrl) return truncatedUrl;
      const match = truncatedUrl.match(/^{(\d+)}/);
      if (!match || !metaData) return truncatedUrl;
      const index = parseInt(match[1], 10);
      return truncatedUrl.replace(`{${index}}`, metaData.urlPrefixes[index]);
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
      setError(null);

      try {
        // Get the meta data first
        const metaData = await getMetaData();
        setMetaData(metaData);

        // Ensure "Uncategorised" genre exists and get its ID
        const uncategorisedId = ensureUncategorisedGenre(metaData.genres);
        const validGenreIds = new Set(Object.keys(metaData.genres));

        // Helper to process and update movies
        const processAndUpdateMovies = (newMovies: CinemaData["movies"]) => {
          const processed = assignUncategorisedGenre(
            newMovies,
            uncategorisedId,
            validGenreIds,
          );
          updateMovies(processed);
        };

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
          await getMovieData(prioritisedFilename).then(processAndUpdateMovies);
        }

        // Get the remaining data files
        // Use Promise.allSettled to continue loading even if some files fail
        const results = await Promise.allSettled(
          metaData.filenames
            .filter((filename: string) => filename !== prioritisedFilename)
            .map((filename: string) =>
              getMovieData(filename).then(processAndUpdateMovies),
            ),
        );

        // Check for any failures and log them (but don't fail completely)
        const failures = results.filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        if (failures.length > 0) {
          console.error(
            `Failed to load ${failures.length} data file(s):`,
            failures.map((f) => f.reason),
          );
          // If all files failed, set an error
          if (failures.length === results.length && !prioritisedFilename) {
            throw new DataFetchError(
              "Failed to load movie data. Please try again later.",
            );
          }
        }
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

  const isEmpty = useMemo(() => Object.keys(movies).length === 0, [movies]);

  const contextValue = useMemo(
    () => ({
      metaData,
      movies,
      isLoading,
      isEmpty,
      error,
      getData,
      getDataWithPriority,
      hydrateUrl,
      retry,
    }),
    [
      metaData,
      movies,
      isLoading,
      isEmpty,
      error,
      getData,
      getDataWithPriority,
      hydrateUrl,
      retry,
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

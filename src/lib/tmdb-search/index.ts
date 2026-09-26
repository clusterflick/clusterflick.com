/**
 * Client for the TMDB search Worker (clusterflick/api-tmdb-search), served
 * same-origin at /api/tmdb/*. It only answers signed-in readers, so every call
 * carries the Firebase ID token.
 */

/** A film as the Worker returns it, ready to be a list entry. */
export type TmdbSearchResult = {
  /** TheMovieDB's id, which is also our film id for a matched film. */
  id: string;
  title: string;
  originalTitle?: string;
  year?: string;
  releaseDate?: string;
  posterPath?: string;
  overview?: string;
};

export type TmdbSearchResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbSearchResult[];
};

export class TmdbSearchError extends Error {
  constructor(
    readonly reason: "rate-limited" | "unavailable",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Searches TheMovieDB. A 401 means the token went stale, so it's refreshed and
 * the search tried once more; a 429 is surfaced rather than retried, since
 * retrying is what got it limited.
 */
export async function searchTmdb(
  query: string,
  getIdToken: (forceRefresh?: boolean) => Promise<string>,
  signal?: AbortSignal,
): Promise<TmdbSearchResponse> {
  const url = `/api/tmdb/search?${new URLSearchParams({ q: query.trim() })}`;
  const request = async (forceRefresh: boolean) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${await getIdToken(forceRefresh)}` },
      signal,
    });

  let response = await request(false);
  if (response.status === 401) response = await request(true);

  if (response.status === 429) {
    throw new TmdbSearchError(
      "rate-limited",
      "That's a lot of searching. Give it a minute and try again.",
    );
  }
  if (!response.ok) {
    throw new TmdbSearchError(
      "unavailable",
      "Search isn't working right now. Please try again later.",
    );
  }
  return response.json();
}

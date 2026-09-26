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

type GetIdToken = (forceRefresh?: boolean) => Promise<string>;

/**
 * A request to the Worker with the reader's token. A 401 means the token went
 * stale, so it's refreshed and the request tried once more.
 */
async function fetchWithToken(
  url: string,
  init: RequestInit,
  getIdToken: GetIdToken,
) {
  const request = async (forceRefresh: boolean) =>
    fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${await getIdToken(forceRefresh)}`,
      },
    });
  const response = await request(false);
  return response.status === 401 ? request(true) : response;
}

/**
 * Searches TheMovieDB. A 429 is surfaced rather than retried, since retrying
 * is what got it limited.
 */
export async function searchTmdb(
  query: string,
  getIdToken: GetIdToken,
  signal?: AbortSignal,
): Promise<TmdbSearchResponse> {
  const response = await fetchWithToken(
    `/api/tmdb/search?${new URLSearchParams({ q: query.trim() })}`,
    { signal },
    getIdToken,
  );

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

/**
 * The most films one match call takes: what the Worker can look up within a
 * Workers Free request's 50 subrequests. The Worker rejects a bigger batch.
 */
export const MATCH_BATCH_SIZE = 15;

/** A film as an import names it. */
export type TmdbMatchQuery = { title: string; year?: number };

/**
 * Finds each film on TheMovieDB, strictly — a title that matches, or the only
 * result for that year — and gives its match or null, in the order asked.
 * Throws `TmdbSearchError`, with `rate-limited` for a 429, rather than
 * reporting films it couldn't look up as missing.
 */
export async function matchTmdb(
  films: TmdbMatchQuery[],
  getIdToken: GetIdToken,
  signal?: AbortSignal,
): Promise<(TmdbSearchResult | null)[]> {
  const response = await fetchWithToken(
    "/api/tmdb/match",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ films }),
      signal,
    },
    getIdToken,
  );
  if (response.status === 429) {
    throw new TmdbSearchError("rate-limited", "Too many lookups at once.");
  }
  if (!response.ok) {
    throw new TmdbSearchError(
      "unavailable",
      "We couldn't reach TheMovieDB. Please try again later.",
    );
  }
  return (await response.json()).results;
}

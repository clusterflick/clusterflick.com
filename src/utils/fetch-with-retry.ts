export const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 500;
// No response in 30s is a hung socket, not a slow one. Without it a stalled
// chunk holds the whole load open, and the reader never gets the notice.
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * A fetch that failed every attempt, or was refused outright. `status` is set
 * when the server answered; its absence means the request never got one
 * (offline, dropped connection, timeout) or the body could not be read.
 */
export class FetchRetryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly status?: number,
    public readonly attempts: number = 1,
  ) {
    super(message);
    this.name = "FetchRetryError";
  }
}

interface FetchWithRetryOptions {
  attempts?: number;
  /** Injectable for tests, which would otherwise sit through the backoff. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// 5xx, 408 and 429 are the server asking us to come back later; any other 4xx
// is a permanent answer that no amount of retrying will change.
export const isRetryableStatus = (status: number) =>
  status === 408 || status === 429 || status >= 500;

// Older Safari has no AbortSignal.timeout; there the request simply runs
// without one, as every request did before this.
const timeoutSignal = () =>
  typeof AbortSignal !== "undefined" &&
  typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;

/**
 * Fetches a URL and reads its body through `read`, retrying network errors,
 * timeouts and server-side failures with jittered exponential backoff.
 *
 * The body is read inside the retried attempt rather than by the caller: a
 * connection dropped part-way through a response is exactly the failure worth
 * retrying, and it happens while streaming, after the headers have arrived.
 * A body that fails to parse is retried for the same reason — a truncated
 * response is the likely cause, not a malformed file.
 *
 * Mirrors `fetchWithRetry` in `scripts/fetch-calendar-data.js`, which does the
 * same job for the calendar feeds at build time.
 */
export async function fetchWithRetry<T>(
  url: string,
  read: (response: Response) => Promise<T>,
  {
    attempts = MAX_ATTEMPTS,
    sleep = defaultSleep,
    fetchImpl = (input, init) => fetch(input, init),
  }: FetchWithRetryOptions = {},
): Promise<T> {
  let lastError: FetchRetryError | undefined;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response | undefined;
    try {
      response = await fetchImpl(url, { signal: timeoutSignal() });
    } catch (err) {
      lastError = new FetchRetryError(
        `Network error fetching ${url}`,
        err,
        undefined,
        attempt,
      );
    }

    if (response) {
      if (!response.ok) {
        const error = new FetchRetryError(
          `${url}: ${response.status} ${response.statusText}`,
          undefined,
          response.status,
          attempt,
        );
        // Stop rather than spend three more attempts confirming a 404.
        if (!isRetryableStatus(response.status)) throw error;
        lastError = error;
      } else {
        try {
          return await read(response);
        } catch (err) {
          lastError = new FetchRetryError(
            `Failed to read response from ${url}`,
            err,
            undefined,
            attempt,
          );
        }
      }
    }

    if (attempt < attempts) {
      // Every chunk is requested at once, so one blip knocks them all out
      // together; the jitter stops them all coming back at the same instant.
      const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(delay + Math.random() * RETRY_BASE_MS);
    }
  }

  throw lastError;
}

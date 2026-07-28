import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import type {
  CinemaData,
  DiffBlob,
  DiffModifiedShowing,
  DiffShowing,
  Movie,
} from "@/types";
import { getMovieUrl, SHOW_ALL_HASH } from "./get-movie-url";
import { getVenueUrl } from "./get-venue-url";

/** A venue a film newly appeared at, or gained dates at, in a given run. */
export type UpdateVenue = {
  id: string;
  name: string;
  href: string | null;
};

/** One film's worth of change in a single run, across every venue involved. */
export type UpdateFilm = {
  /** Stable within a run; the movie id when matched, else the title. */
  key: string;
  title: string;
  /**
   * Link to the film's page, when it is still in the current dataset. Carries
   * the show-all hash: an update names showings the reader's own filters would
   * often hide, so arriving to an empty schedule would make the entry a lie.
   */
  href: string | null;
  posterPath?: string;
  year?: string;
  classification?: string;
  venues: UpdateVenue[];
  /** Newly scheduled performances contributed by this run's change. */
  performanceCount: number;
  /** Earliest newly scheduled performance. Not shown on the page; kept for the feed. */
  nextPerformance: number | null;
};

export type UpdateVenueAddition = {
  id: string;
  name: string;
  href: string | null;
};

/**
 * One pipeline run's worth of changes — one published diff, one section on the
 * page, and one item in the feed. Runs are kept separate rather than merged by
 * day so that the page and the RSS feed describe exactly the same units.
 */
export type UpdateRelease = {
  /** The `data-transformed` release this diff describes, e.g. `20260726.055841`. */
  tag: string;
  /** When that release was published; the section is headed with its date and time. */
  asOf: string;
  /** Films arriving in the listings for the first time. */
  newFilms: UpdateFilm[];
  /** Films already playing elsewhere, now at a new venue or with new dates. */
  moreShowings: UpdateFilm[];
  newVenues: UpdateVenueAddition[];
};

/**
 * "1 film", "10,293 showings" — the site counts performance times as showings.
 * A busy run reaches five figures, so counts are grouped as the rest of the
 * site groups them.
 */
export function pluralise(count: number, word: string): string {
  return `${count.toLocaleString("en-GB")} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * One line describing what a run brought, so it can be skimmed without reading
 * the entries. Shared by the page and the feed so the two cannot drift.
 */
export function summariseRelease(release: UpdateRelease): string {
  const parts: string[] = [];

  if (release.newFilms.length > 0) {
    parts.push(`${pluralise(release.newFilms.length, "film")} added`);
  }

  if (release.moreShowings.length > 0) {
    const showings = release.moreShowings.reduce(
      (total, film) => total + film.performanceCount,
      0,
    );
    parts.push(
      `${pluralise(showings, "showing")} added to ${pluralise(
        release.moreShowings.length,
        "film",
      )}`,
    );
  }

  if (release.newVenues.length > 0) {
    parts.push(`${pluralise(release.newVenues.length, "venue")} added`);
  }

  const sentence = parts.join(", ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/**
 * Index every showing id in the current dataset back to its movie, so a change
 * recorded against a showing can be attributed to the film it belongs to. This
 * is an exact join: the pipeline uses the same showing id end to end.
 */
function buildShowingIndex(movies: Record<string, Movie>): Map<string, Movie> {
  const index = new Map<string, Movie>();
  for (const movie of Object.values(movies)) {
    for (const showingId of Object.keys(movie.showings ?? {})) {
      index.set(showingId, movie);
    }
  }
  return index;
}

/**
 * Resolve a changed showing to a film in the current dataset.
 *
 * Falls back from the exact showing-id join to the movie match recorded in the
 * diff, which covers a showing that has since been removed while the film is
 * still listed elsewhere. When neither resolves — an unmatched event, or a film
 * that has left the dataset entirely — the entry still renders from the diff's
 * own title, just without a link or poster.
 */
function resolveMovie(
  showing: DiffShowing | DiffModifiedShowing,
  showingIndex: Map<string, Movie>,
  movies: Record<string, Movie>,
): Movie | undefined {
  const byShowing = showingIndex.get(showing.showingId);
  if (byShowing) return byShowing;

  const matchId = showing.themoviedb?.id ?? showing.themoviedbs?.[0]?.id;
  if (matchId === undefined) return undefined;
  return movies[String(matchId)];
}

/**
 * When a film was first seen anywhere in the listings, taken as the earliest
 * `seen` across every showing it currently has.
 *
 * This is what separates a genuinely new film from one rolling out to more
 * venues. Presence in the dataset cannot tell them apart — the dataset is
 * current state, so a film added by this very run is in it either way. A film
 * that started at one venue keeps that first venue's `seen` as it spreads,
 * because the pipeline carries the original sighting forward, so comparing it
 * against the run's own period answers "was this already playing somewhere?".
 *
 * Undefined when no showing carries a `seen`, in which case the caller has
 * nothing to judge on and falls back to treating the film as new.
 */
function buildFirstSeenIndex(
  movies: Record<string, Movie>,
): Map<string, number> {
  const index = new Map<string, number>();
  for (const movie of Object.values(movies)) {
    let earliest: number | undefined;
    for (const showing of Object.values(movie.showings ?? {})) {
      if (typeof showing.seen !== "number") continue;
      if (earliest === undefined || showing.seen < earliest) {
        earliest = showing.seen;
      }
    }
    if (earliest !== undefined) index.set(movie.id, earliest);
  }
  return index;
}

/**
 * Pipeline release tags are `YYYYMMDD.HHMMSS` in London time. Only needed for
 * the oldest run in the window, whose preceding release isn't itself in the
 * window; every other run takes the boundary from the blob before it.
 *
 * Returns NaN for an unparseable tag, which reads as "boundary unknown" and
 * leaves the caller to fall back on the window ordering alone.
 */
function parseReleaseTag(tag: string): number {
  const match = tag?.match(/^(\d{4})(\d{2})(\d{2})\.(\d{2})(\d{2})(\d{2})$/);
  if (!match) return NaN;
  const [, year, month, day, hour, minute, second] = match;
  // Treating the London wall-clock time as UTC is at most an hour out during
  // BST, which is far finer than the gap between a new film and a rollout.
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}

type Accumulator = {
  film: UpdateFilm;
  /** Whether this run saw the film appear somewhere it wasn't before. */
  hasAddition: boolean;
  /** Earliest sighting anywhere, used to tell a new film from a wider rollout. */
  firstSeen?: number;
};

function accumulate(
  byKey: Map<string, Accumulator>,
  showing: DiffShowing | DiffModifiedShowing,
  venue: UpdateVenue,
  performanceTimes: number[],
  isAddition: boolean,
  showingIndex: Map<string, Movie>,
  firstSeenIndex: Map<string, number>,
  data: CinemaData,
) {
  const movie = resolveMovie(showing, showingIndex, data.movies);
  const key = movie ? movie.id : `title:${showing.title.toLowerCase()}`;

  let entry = byKey.get(key);
  if (!entry) {
    entry = {
      hasAddition: false,
      firstSeen: movie ? firstSeenIndex.get(movie.id) : undefined,
      film: {
        key,
        title: movie?.title ?? showing.title,
        href: movie ? `${getMovieUrl(movie)}${SHOW_ALL_HASH}` : null,
        posterPath: movie?.posterPath,
        year: movie?.year,
        classification: movie?.classification,
        venues: [],
        performanceCount: 0,
        nextPerformance: null,
      },
    };
    byKey.set(key, entry);
  }

  entry.hasAddition ||= isAddition;
  if (!entry.film.venues.some(({ id }) => id === venue.id)) {
    entry.film.venues.push(venue);
  }
  entry.film.performanceCount += performanceTimes.length;

  const earliest = performanceTimes.length
    ? Math.min(...performanceTimes)
    : null;
  if (
    earliest !== null &&
    (entry.film.nextPerformance === null ||
      earliest < entry.film.nextPerformance)
  ) {
    entry.film.nextPerformance = earliest;
  }
}

/**
 * Turn a window of pipeline diffs into a reverse-chronological feed, one entry
 * per pipeline run.
 *
 * A film is "new" only when it arrives in the listings for the first time. One
 * that has been playing elsewhere and is now spreading to another cinema counts
 * as more screenings, however new it is to that particular venue — otherwise a
 * slow rollout would keep reappearing as new for weeks.
 *
 * Runs that turn out to contain nothing worth showing (only reschedules, say)
 * are dropped, so the page never renders an empty section.
 */
export function buildUpdates(
  blobs: DiffBlob[],
  data: CinemaData,
): UpdateRelease[] {
  const showingIndex = buildShowingIndex(data.movies);
  const firstSeenIndex = buildFirstSeenIndex(data.movies);

  // Oldest first, so "first appearance" is decided in chronological order
  const ordered = [...blobs].sort(
    (a, b) =>
      new Date(a.metadata.asOf).getTime() - new Date(b.metadata.asOf).getTime(),
  );

  const seenBefore = new Set<string>();
  const result: UpdateRelease[] = [];

  for (const [index, blob] of ordered.entries()) {
    // The run's diff period starts at the release it was compared against. The
    // preceding blob is that release; at the start of the window there is no
    // earlier blob, so fall back to the tag the diff recorded.
    const periodStart =
      index > 0
        ? new Date(ordered[index - 1].metadata.asOf).getTime()
        : parseReleaseTag(blob.metadata.previousRelease);

    const films = new Map<string, Accumulator>();
    const venues = new Map<string, UpdateVenueAddition>();

    for (const [venueId, diffVenue] of Object.entries(blob.venues)) {
      const known = data.venues[venueId];
      const name = known?.name ?? diffVenue.name ?? venueId;
      const venue: UpdateVenue = {
        id: venueId,
        name,
        href: known ? getVenueUrl(known) : null,
      };

      if (diffVenue.venueAdded) {
        venues.set(venueId, { id: venueId, name, href: venue.href });
      }

      for (const showing of diffVenue.showings.added) {
        accumulate(
          films,
          showing,
          venue,
          showing.performances ?? [],
          true,
          showingIndex,
          firstSeenIndex,
          data,
        );
      }

      for (const showing of diffVenue.showings.modified) {
        // Only added dates are of interest; reschedules and removals are not
        // things a reader can act on
        if (showing.performances.added.length === 0) continue;
        accumulate(
          films,
          showing,
          venue,
          showing.performances.added,
          false,
          showingIndex,
          firstSeenIndex,
          data,
        );
      }
    }

    const newFilms: UpdateFilm[] = [];
    const moreShowings: UpdateFilm[] = [];

    for (const [key, { film, hasAddition, firstSeen }] of films) {
      // "New" means new to the listings, not new to a venue. A film that has
      // been playing elsewhere and is now rolling out to another cinema was
      // first seen before this run's period, so it belongs under more
      // screenings. Without a first sighting to go on, fall back to the window.
      const alreadyPlaying =
        firstSeen !== undefined &&
        !Number.isNaN(periodStart) &&
        firstSeen < periodStart;

      const isNew = hasAddition && !seenBefore.has(key) && !alreadyPlaying;
      (isNew ? newFilms : moreShowings).push(film);
    }

    // Marked after the whole run is classified so a film added at two venues in
    // the same run isn't demoted against its own first sighting
    for (const key of films.keys()) seenBefore.add(key);

    if (
      newFilms.length === 0 &&
      moreShowings.length === 0 &&
      venues.size === 0
    ) {
      continue;
    }

    const byPerformances = (a: UpdateFilm, b: UpdateFilm) =>
      b.performanceCount - a.performanceCount || a.title.localeCompare(b.title);

    result.push({
      tag: blob.metadata.currentRelease,
      asOf: blob.metadata.asOf,
      newFilms: newFilms.sort(byPerformances),
      moreShowings: moreShowings.sort(byPerformances),
      newVenues: [...venues.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    });
  }

  // Newest run first for display
  return result.reverse();
}

/** Read the downloaded diff window from disk. Missing data yields no updates. */
export function readDiffBlobs(
  directory = join(process.cwd(), "diffed-data"),
): DiffBlob[] {
  if (!existsSync(directory)) return [];

  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map(
      (file) =>
        JSON.parse(readFileSync(join(directory, file), "utf-8")) as DiffBlob,
    );
}

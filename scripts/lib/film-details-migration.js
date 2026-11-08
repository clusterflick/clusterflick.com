/**
 * The decisions behind scripts/migrate-film-details.js, kept free of Firestore
 * and the network so they can be tested.
 *
 * What it writes must match what the site writes when a film is added (see
 * `@/lib/user-lists/film-details`), and what TMDB gives must be read the way
 * the search Worker's details endpoint reads it (`trimDetails` in
 * clusterflick/api-tmdb-search), which in turn follows the pipeline's
 * `build-movie-data.js`. They're repeated here rather than imported, since
 * the site's modules are TypeScript behind path aliases a plain Node script
 * can't load.
 */

/** Top-billed cast kept per film, as `FILM_DETAILS_CAST_LIMIT`. */
const CAST_LIMIT = 5;

/** The lists whose films have details, as `UserListId`. */
const LIST_IDS = ["watchlist", "seen"];

/**
 * Whether a listed film's id is TheMovieDB's, as the site's `isTmdbId`: an
 * unmatched film's id is the pipeline's own, eight hex characters that can be
 * all digits, and TMDB's are under eight digits with no leading zero.
 */
function isTmdbId(id) {
  return /^[1-9]\d{0,6}$/.test(id);
}

/** Every film on any of a user's lists. */
function getListedIds(userData = {}) {
  return new Set(
    LIST_IDS.flatMap((listId) => Object.keys(userData[listId] ?? {})),
  );
}

/** The first of each person, in the order given, with a name to show. */
function uniquePeople(people) {
  const seen = new Set();
  return people.flatMap((person) => {
    if (seen.has(person.id) || !person.name) return [];
    seen.add(person.id);
    return [{ id: String(person.id), name: person.name }];
  });
}

/**
 * A film's details from TMDB's `/movie/{id}?append_to_response=credits`, as
 * the Worker's `trimDetails` gives them: directors by credit id, cast by
 * billing and cut to the top five.
 */
function trimTmdbMovie(raw) {
  const crew = raw.credits?.crew ?? [];
  const directors = crew
    .filter(({ job }) => job?.toLowerCase() === "director")
    .sort(
      (a, b) => `${a.credit_id}`.localeCompare(`${b.credit_id}`) || a.id - b.id,
    );
  const cast = [...(raw.credits?.cast ?? [])].sort(
    (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
  );
  return {
    genres: (raw.genres ?? []).map(({ id }) => String(id)),
    directors: uniquePeople(directors),
    cast: uniquePeople(cast).slice(0, CAST_LIMIT),
    ...(raw.runtime && { runtime: raw.runtime }),
    ...(raw.original_language && { language: raw.original_language }),
  };
}

/**
 * A user's whole details document: every listed film's details, and the names
 * those films use — nothing for films on no list, which drops the details a
 * removal left behind.
 *
 * - `fetched` holds what TMDB gave this run (null where it has no such film).
 *   It wins over what's stored, so every film is brought to the same level.
 * - A film that's stored but wasn't fetched keeps what it has: one added with
 *   its details while the migration ran, or one TMDB can no longer describe.
 *
 * Returns the document, and the listed films left without details: unmatched
 * films, which have no TMDB record, and films TMDB doesn't have.
 */
function buildDetailsDocument(listedIds, fetched, stored = {}) {
  const document = { films: {}, people: {} };
  const withoutDetails = [];
  const storedFilms = stored.films ?? {};
  const storedPeople = stored.people ?? {};

  for (const id of [...listedIds].sort()) {
    const film = fetched.get(id);
    if (film) {
      document.films[id] = {
        genres: film.genres,
        directors: film.directors.map(({ id }) => id),
        cast: film.cast.map(({ id }) => id),
        ...(film.runtime && { runtime: film.runtime }),
        ...(film.language && { language: film.language }),
      };
      for (const person of [...film.directors, ...film.cast]) {
        document.people[person.id] = person.name;
      }
    } else if (storedFilms[id]) {
      document.films[id] = storedFilms[id];
      for (const person of [
        ...storedFilms[id].directors,
        ...storedFilms[id].cast,
      ]) {
        if (storedPeople[person])
          document.people[person] = storedPeople[person];
      }
    } else {
      withoutDetails.push(id);
    }
  }
  return { document, withoutDetails };
}

/** Whether two documents hold the same data, whatever their key order. */
function isSameDocument(a, b) {
  const canonical = (value) =>
    JSON.stringify(value, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(
            Object.entries(v).sort(([x], [y]) => x.localeCompare(y)),
          )
        : v,
    );
  return canonical(a) === canonical(b);
}

module.exports = {
  CAST_LIMIT,
  isTmdbId,
  getListedIds,
  trimTmdbMovie,
  buildDetailsDocument,
  isSameDocument,
};

/**
 * The decisions behind scripts/add-movie-list-tmdb-ids.mjs, kept free of the
 * network and the file system so they can be tested: which TMDB search result
 * a list entry is, and how an id is written into a list file's source.
 */

/**
 * A title reduced to what two spellings of it share: case, accents,
 * punctuation and "&" for "and" fold away, as the search Worker's matching
 * does, and so do British and American spellings of colour ("Three Colours:
 * Blue" is TMDB's "Three Colors: Blue") and "½" ("8 1/2" is "8½").
 */
function normaliseTitle(title) {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/½/g, "1/2")
    .replace(/colour/g, "color")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * How far ahead on votes the best-known of several same-titled films must be
 * to be taken: a famous film and an obscure namesake from the same year
 * ("Rocky" and a short filed under 1976) are far apart, two real films of the
 * same name usually aren't.
 */
const VOTE_LEAD = 10;

function releaseYear(result) {
  const year = result.release_date?.match(/^(\d{4})-/)?.[1];
  return year ? Number(year) : undefined;
}

/**
 * The search result a list entry is, strictly: its title or original title
 * matches one of the entry's (`title`, `altTitles`), and its release year is
 * within `yearTolerance` of the entry's. An award list cites the award's year,
 * which can trail the film's by two, hence the tolerance.
 *
 * Several candidates are narrowed to those nearest the entry's year; more than
 * one left is `ambiguous`, never a guess, and goes to the reader to settle.
 */
function pickListMatch(entry, results, yearTolerance = 1) {
  const wanted = new Set(
    [entry.title, ...(entry.altTitles ?? [])]
      .map(normaliseTitle)
      .filter(Boolean),
  );
  const candidates = results.filter((result) => {
    const titles = [result.title, result.original_title].filter(Boolean);
    if (!titles.some((title) => wanted.has(normaliseTitle(title)))) {
      return false;
    }
    if (entry.year === undefined) return true;
    const year = releaseYear(result);
    return year !== undefined && Math.abs(year - entry.year) <= yearTolerance;
  });
  if (candidates.length === 0) return { status: "missing" };
  const distance = (result) =>
    entry.year === undefined
      ? 0
      : Math.abs((releaseYear(result) ?? Infinity) - entry.year);
  const nearest = Math.min(...candidates.map(distance));
  const closest = candidates.filter((result) => distance(result) === nearest);
  if (closest.length > 1) {
    const byVotes = [...closest].sort(
      (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0),
    );
    const [top, next] = byVotes;
    if (
      (top.vote_count ?? 0) >=
      VOTE_LEAD * Math.max(1, next.vote_count ?? 0)
    ) {
      return { status: "matched", tmdbId: String(top.id) };
    }
    return { status: "ambiguous", candidates: byVotes.map(describe) };
  }
  return { status: "matched", tmdbId: String(closest[0].id) };
}

/** A search result in a line a reader can check: id, title, year and votes. */
function describe(result) {
  const votes =
    result.vote_count !== undefined ? `, ${result.vote_count} votes` : "";
  return `${result.id} ${result.title} (${releaseYear(result) ?? "no year"}${votes})`;
}

/**
 * The best-known results, whatever their titles, for an entry nothing
 * matched: usually the film under another name ("Se7en" for "Seven"), for
 * the reader to pick from.
 */
function suggestCandidates(results, limit = 3) {
  return [...results]
    .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
    .slice(0, limit)
    .map(describe);
}

/**
 * The array literal's entry objects in `source`, in order, as [start, end]
 * offsets of each top-level `{ … }` after `export const <name> … = [`.
 * Skips strings and comments, so a brace or bracket in a title or note
 * doesn't throw the count.
 */
function findEntryObjects(source, exportName) {
  // To the end of "= [": the type's own brackets ("MovieListEntry[]") come
  // first and aren't the array.
  const declaration = new RegExp(
    `export const ${exportName}\\b[^=]*=\\s*\\[`,
  ).exec(source);
  if (!declaration) throw new Error(`No array exported as ${exportName}`);
  const objects = [];
  let depth = 0;
  let objectStart = -1;
  let i = declaration.index + declaration[0].length;
  for (; i < source.length; i++) {
    const char = source[i];
    if (char === '"' || char === "'" || char === "`") {
      // To the closing quote, past escapes.
      for (i++; i < source.length && source[i] !== char; i++) {
        if (source[i] === "\\") i++;
      }
    } else if (char === "/" && source[i + 1] === "/") {
      i = source.indexOf("\n", i);
    } else if (char === "/" && source[i + 1] === "*") {
      i = source.indexOf("*/", i) + 1;
    } else if (char === "{" || char === "[") {
      if (depth === 0 && char === "{") objectStart = i;
      depth++;
    } else if (char === "}" || char === "]") {
      if (depth === 0) break; // The array's own closing bracket.
      depth--;
      if (depth === 0 && char === "}") objects.push([objectStart, i]);
    }
  }
  return objects;
}

/**
 * `source` with each entry given its id from `ids` (same order as the
 * entries; undefined leaves an entry as it is), added as the entry's last
 * property. Formatting is left to Prettier. Throws if the entries counted in
 * the source don't match `ids`, rather than write an id into the wrong film.
 */
function insertTmdbIds(source, exportName, ids) {
  const objects = findEntryObjects(source, exportName);
  if (objects.length !== ids.length) {
    throw new Error(
      `${exportName}: found ${objects.length} entries in the source, expected ${ids.length}`,
    );
  }
  let result = source;
  // From the end, so earlier offsets stay valid.
  for (let index = objects.length - 1; index >= 0; index--) {
    const id = ids[index];
    if (id === undefined) continue;
    const [, end] = objects[index];
    const before = result.slice(0, end).trimEnd();
    const separator = before.endsWith(",") || before.endsWith("{") ? " " : ", ";
    result = `${before}${separator}tmdbId: ${JSON.stringify(id)} ${result.slice(end)}`;
  }
  return result;
}

module.exports = {
  normaliseTitle,
  pickListMatch,
  suggestCandidates,
  findEntryObjects,
  insertTmdbIds,
};

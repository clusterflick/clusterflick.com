/* eslint-disable */
/**
 * Gives every curated movie list entry its TMDB id (`tmdbId` in
 * `src/data/movie-lists/<list>.ts`), the id the dataset and a reader's lists
 * key films by. With it, a list matches a film by direct lookup rather than by
 * title, and a reader's Seen list can be held against it.
 *
 *   npm run add-movie-list-tmdb-ids            # dry run: reports, writes nothing
 *   npm run add-movie-list-tmdb-ids -- --write # writes the ids it's sure of
 *
 * Needs TMDB_TOKEN (a TMDB API Read Access Token) in the environment or .env.
 *
 * Entries that already have an id are skipped, so a run after fixing some by
 * hand only looks up the rest, and adding a list is one more run. For each
 * entry without one:
 *
 * - An IMDb id is looked up on TMDB's find endpoint: exact.
 * - Otherwise its title and any alternative titles are searched, first with
 *   no year and then with the entry's, and a result is taken only if its
 *   title or original title matches and its release year is within the
 *   list's tolerance (`pickListMatch`). Two equally near results are
 *   ambiguous, never a guess.
 *
 * Whatever isn't matched is listed at the end, with any candidates, to be
 * filled in by hand. Two entries in one list landing on the same film are
 * both held back, as one of them is wrong.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as prettier from "prettier";
import { LIST_FILES } from "./add-movie-list-tmdb-ids.config.mjs";

const require = createRequire(import.meta.url);
const { checkTmdbToken, fetchTmdbJson, forEachLimited } = require("./lib/tmdb");
const { insertTmdbIds, pickListMatch } = require("./lib/movie-list-tmdb-ids");

const LISTS_DIR = path.join(
  import.meta.dirname,
  "..",
  "src",
  "data",
  "movie-lists",
);
/** Lookups in flight at once: TMDB allows around 40 requests a second. */
const CONCURRENCY = 8;

async function resolveByImdbId(entry, token) {
  const found = await fetchTmdbJson(`find/${entry.imdbId}`, token, {
    external_source: "imdb_id",
  });
  const movies = found?.movie_results ?? [];
  if (movies.length === 1) {
    return { status: "matched", tmdbId: String(movies[0].id) };
  }
  return movies.length === 0
    ? { status: "missing" }
    : {
        status: "ambiguous",
        candidates: movies.map((m) => `${m.id} ${m.title}`),
      };
}

async function resolveBySearch(entry, yearTolerance, token) {
  const queries = [entry.title, ...(entry.altTitles ?? [])];
  const pool = new Map();
  let result = { status: "missing" };
  // Without a year first, which reaches a film whatever its listed year; then
  // with the entry's, which surfaces an obscure film the first page buries.
  for (const year of [undefined, entry.year]) {
    for (const query of queries) {
      const page = await fetchTmdbJson("search/movie", token, {
        query,
        include_adult: "false",
        ...(year !== undefined && { year: String(year) }),
      });
      for (const movie of page?.results ?? []) pool.set(movie.id, movie);
    }
    result = pickListMatch(entry, [...pool.values()], yearTolerance);
    if (result.status !== "missing") return result;
    if (entry.year === undefined) break;
  }
  return result;
}

function describeEntry(entry) {
  const rank = entry.rank !== undefined ? `#${entry.rank} ` : "";
  return `${rank}"${entry.title}"${entry.year ? ` (${entry.year})` : ""}`;
}

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env: the environment has to carry it.
  }
  const write = process.argv.includes("--write");
  const token = process.env.TMDB_TOKEN;
  if (!token)
    throw new Error("TMDB_TOKEN is not set; see the top of this script");
  await checkTmdbToken(token);

  const unresolved = [];
  let totalAdded = 0;
  for (const list of LIST_FILES) {
    const file = path.join(LISTS_DIR, list.file);
    const entries = (await import(pathToFileURL(file).href))[list.exportName];
    const todo = entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !entry.tmdbId);
    const results = new Array(entries.length);

    const failed = await forEachLimited(
      todo,
      CONCURRENCY,
      async ({ entry, index }) => {
        results[index] = entry.imdbId
          ? await resolveByImdbId(entry, token)
          : await resolveBySearch(entry, list.yearTolerance, token);
      },
    );
    for (const { item, error } of failed) {
      results[item.index] = { status: "failed", error };
    }

    // Two entries on one film: one of them is wrong, so neither is written.
    const byId = new Map();
    entries.forEach((entry, index) => {
      const id =
        entry.tmdbId ??
        (results[index]?.status === "matched" && results[index].tmdbId);
      if (id) byId.set(id, [...(byId.get(id) ?? []), index]);
    });
    for (const indices of byId.values()) {
      if (indices.length < 2) continue;
      for (const index of indices) {
        if (results[index]?.status === "matched") {
          results[index] = {
            status: "duplicate",
            candidates: indices.map((i) => describeEntry(entries[i])),
          };
        }
      }
    }

    const ids = entries.map((_, index) =>
      results[index]?.status === "matched" ? results[index].tmdbId : undefined,
    );
    const added = ids.filter(Boolean).length;
    totalAdded += added;
    const already = entries.length - todo.length;
    const open = todo.length - added;
    console.log(
      `${list.id}: ${entries.length} entries, ${already} had ids, ${added} matched, ${open} to settle by hand`,
    );
    entries.forEach((entry, index) => {
      const result = results[index];
      if (!result || result.status === "matched") return;
      unresolved.push({ list: list.id, entry, result });
    });

    if (write && added > 0) {
      const source = await readFile(file, "utf8");
      const updated = insertTmdbIds(source, list.exportName, ids);
      const options = await prettier.resolveConfig(file);
      await writeFile(
        file,
        await prettier.format(updated, { ...options, filepath: file }),
      );
    }
  }

  if (unresolved.length > 0) {
    console.log(`\n${unresolved.length} entries to settle by hand:`);
    for (const { list, entry, result } of unresolved) {
      const detail =
        result.status === "failed"
          ? `lookup failed (${result.error}); run again`
          : result.candidates
            ? `${result.status}: ${result.candidates.join("; ")}`
            : result.status;
      console.log(`  ${list} ${describeEntry(entry)}: ${detail}`);
    }
  }
  console.log(
    write
      ? `\nDone: ${totalAdded} ids written. Review the diff before committing.`
      : `\nDry run: ${totalAdded} ids would be written. Run with --write to apply.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

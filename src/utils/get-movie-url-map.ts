import { createHash } from "node:crypto";
import slugify from "@sindresorhus/slugify";
import type { Movie } from "@clusterflick/catalogue/types";

/**
 * What the movie-redirects Worker reads to send a dead film URL somewhere
 * better than a 404. It is a contract with that Worker, which refuses any
 * other version: raise this when a field is removed, renamed or changes
 * meaning.
 */
export const MOVIE_URL_MAP_VERSION = 1;

export type MovieUrlMap = {
  version: typeof MOVIE_URL_MAP_VERSION;
  generatedAt: string;
  /**
   * Every film with a page, showing or departed: its id and the slug of its
   * page, `/movies/<id>/<slug>/`. A known id under the wrong slug is a page
   * that moved, when TheMovieDB or a venue retitled it.
   */
  slugs: Record<string, string>;
  /**
   * Showing films only: the id an unmatched listing would have had, mapped to
   * the film that listing is now part of. An unmatched listing is keyed by
   * the first 8 hex characters of the SHA-256 of the venue's title (`getId`
   * in clusterflick/scripts' `common/utils.js`), and a matched film keeps the
   * venue's title on its showing, so hashing those titles recovers the old
   * id exactly. A hash two films carry says nothing about which, and is left
   * out.
   */
  titleHashes: Record<string, string>;
  /**
   * Showing films only: every slug a film can be found under (its title, its
   * other English titles and its venues' titles) and the films under it. For
   * a URL whose id is unknown, one film under its slug, or close to it, is
   * the likeliest page.
   */
  liveSlugs: Record<string, string[]>;
};

type MovieUrlMapInput = {
  /** The films showing now. */
  live: Record<string, Pick<Movie, "title" | "alternativeTitles" | "showings">>;
  /** The films that have finished their run but keep their page. */
  departed: Record<string, Pick<Movie, "title">>;
  generatedAt: string;
};

/** As clusterflick/scripts' `getId`: the id of a listing nothing matched. */
export function getListingId(title: string): string {
  return createHash("sha256").update(title).digest("hex").slice(0, 8);
}

/** The titles a venue listed a film under, and the film's own. */
function getVenueTitles(movie: MovieUrlMapInput["live"][string]): string[] {
  // A showing carries its own title only when it differs from the film's,
  // so the film's title stands in for every showing that doesn't.
  const titles = new Set([movie.title]);
  for (const showing of Object.values(movie.showings ?? {})) {
    if (showing.title) titles.add(showing.title);
  }
  return [...titles];
}

export function getMovieUrlMap({
  live,
  departed,
  generatedAt,
}: MovieUrlMapInput): MovieUrlMap {
  // Keyed by the record's key, the id the page is built under.
  const slugs: Record<string, string> = {};
  for (const [id, movie] of [
    ...Object.entries(departed),
    ...Object.entries(live),
  ]) {
    slugs[id] = slugify(movie.title);
  }

  const hashed = new Map<string, Set<string>>();
  const bySlug = new Map<string, Set<string>>();
  const add = (map: Map<string, Set<string>>, key: string, id: string) => {
    const ids = map.get(key) ?? new Set<string>();
    ids.add(id);
    map.set(key, ids);
  };

  for (const [id, movie] of Object.entries(live)) {
    const venueTitles = getVenueTitles(movie);
    for (const title of venueTitles) {
      const hash = getListingId(title);
      // An unmatched film is keyed by this hash already: its page is live.
      if (hash !== id) add(hashed, hash, id);
    }
    for (const title of [...venueTitles, ...(movie.alternativeTitles ?? [])]) {
      const slug = slugify(title);
      if (slug) add(bySlug, slug, id);
    }
  }

  const titleHashes: Record<string, string> = {};
  for (const [hash, ids] of [...hashed].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (ids.size === 1) titleHashes[hash] = [...ids][0];
  }

  const liveSlugs: Record<string, string[]> = {};
  for (const [slug, ids] of [...bySlug].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    liveSlugs[slug] = [...ids].sort();
  }

  return {
    version: MOVIE_URL_MAP_VERSION,
    generatedAt,
    slugs: Object.fromEntries(
      Object.entries(slugs).sort(([a], [b]) => a.localeCompare(b)),
    ),
    titleHashes,
    liveSlugs,
  };
}

import { RT_MIN_REVIEWS } from "@/utils/movie-ratings.mjs";
import { MovieListSource, type MovieList } from "./types";
import { RT_BEST_OF_ALL_TIME } from "./rt-best-of-all-time";
import { IMDB_TOP_250 } from "./imdb-top-250";
import { GUARDIAN_100_BEST_21ST_CENTURY } from "./guardian-100-best-21st-century";
import { EMPIRE_100_GREATEST } from "./empire-100-greatest";
import { PALME_DOR_WINNERS } from "./palme-dor-winners";
import { LETTERBOXD_TOP_500 } from "./letterboxd-top-500";
import { OSCAR_BEST_PICTURE } from "./oscar-best-picture";
import { OSCAR_BEST_INTERNATIONAL_FEATURE } from "./oscar-best-international-feature";
import { GOLDEN_LION_WINNERS } from "./golden-lion-winners";

export * from "./types";

/**
 * "Top films" lists from rating and review sources, surfaced as pages showing
 * which of their films you can actually go and see in London this week.
 *
 * **What belongs here.** A list is a *named selection with a fixed membership* —
 * something a reader could argue with by name. A threshold slid along a
 * continuum is not a list, it's a filter: "the highest rated films on
 * Letterboxd" has no natural edge, so where you cut it (4.0? 4.2?) is arbitrary
 * and the result is hundreds of films rather than a set worth browsing. Those
 * belong on the films grid as a rating filter and sort, not as a page here.
 *
 * The 100% Club qualifies despite being computed: its boundary (a perfect
 * score) is inherent rather than chosen, and it's a named thing Rotten Tomatoes
 * publishes itself.
 *
 * Two kinds, which behave differently:
 *
 * - **Curated** lists reproduce someone else's published selection. We store
 *   only what identifies each film (title, year, rank, and an id where we have
 *   one) and always link back to the source — the write-ups stay with the
 *   publisher.
 * - **Computed** lists are derived from rating data already in the dataset, so
 *   they re-evaluate on every build and never go stale.
 *
 * The review-count floors are shared with the Critics' Picks row and the
 * editorial summary via `@/utils/movie-ratings.mjs`, so "acclaimed" means the
 * same thing everywhere on the site.
 *
 * To add a curated list, drop a `MovieListEntry[]` alongside
 * `rt-best-of-all-time.ts` and register it here. Entries match on `imdbId`
 * first, then `rtSlug`, then title + year — so a list with only titles and
 * years still works.
 */
export const MOVIE_LISTS: MovieList[] = [
  {
    id: "oscar-best-picture",
    name: "Best Picture Winners",
    badgeLabel: "Best Picture",
    aliases: ["best-picture", "oscars"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "The Academy",
    sourceUrl: "https://www.oscars.org/oscars/ceremonies",
    description:
      "Every film awarded Best Picture at the Academy Awards, from Wings onwards.",
    // Deliberately bled past the right edge, so the statuette reads as applied
    // to the poster rather than placed inside it.
    filmBadge: {
      src: "/images/icons/oscar.svg",
      alt: "Academy Award for Best Picture winner",
      width: 56,
      height: 56,
      insetRight: -10,
      insetBottom: 5,
    },
    // Award years, which sit a year off the film for the earliest ceremonies.
    yearTolerance: 2,
    entries: OSCAR_BEST_PICTURE,
  },
  {
    id: "oscar-best-international-feature",
    name: "Best International Feature Winners",
    badgeLabel: "Int'l Feature",
    aliases: ["best-international-feature", "best-foreign-language-film"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "The Academy",
    sourceUrl: "https://www.oscars.org/oscars/ceremonies",
    description:
      "Every winner of the Academy Award for Best International Feature Film, formerly Best Foreign Language Film.",
    filmBadge: {
      src: "/images/icons/oscar.svg",
      alt: "Academy Award for Best International Feature winner",
      width: 56,
      height: 56,
      insetRight: -10,
      insetBottom: 5,
    },
    // The award year trails the film by up to two.
    yearTolerance: 2,
    entries: OSCAR_BEST_INTERNATIONAL_FEATURE,
  },
  {
    id: "palme-dor-winners",
    name: "Palme d'Or Winners",
    badgeLabel: "Palme d'Or Winners",
    aliases: ["palme-dor", "cannes"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "The Cannes Film Festival",
    sourceUrl:
      "https://www.festival-cannes.com/en/the-festival/the-palme-d-or/",
    description:
      "Every film awarded the Palme d'Or, the top prize at the Cannes Film Festival, since 1955.",
    // The palm marks each winner. This list is unranked, so the slot a ranked
    // list uses for the position is free.
    filmBadge: {
      src: "/images/icons/palme-dor.svg",
      alt: "Palme d'Or winner",
      width: 20,
      height: 56,
    },
    entries: PALME_DOR_WINNERS,
  },
  {
    id: "golden-lion-winners",
    name: "Golden Lion Winners",
    badgeLabel: "Golden Lion",
    aliases: ["golden-lion", "venice"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "The Venice Film Festival",
    sourceUrl: "https://www.labiennale.org/en/cinema",
    description:
      "Every film awarded the Golden Lion, the top prize at the Venice Film Festival, since 1949.",
    // Landscape, unlike the upright palm, so it sits lower and wider.
    filmBadge: {
      src: "/images/icons/golden-lion.svg",
      alt: "Golden Lion winner",
      width: 33,
      height: 20,
      insetRight: 5,
      insetBottom: 8,
    },
    yearTolerance: 2,
    entries: GOLDEN_LION_WINNERS,
  },
  {
    id: "empire-100-greatest",
    name: "The 100 Greatest Movies Ever Made",
    badgeLabel: "Empire Greatest 100",
    aliases: ["empire-100", "empire"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "Empire",
    sourceUrl: "https://www.empireonline.com/movies/features/best-movies-2/",
    description:
      "Empire's countdown of the greatest films ever made, as voted for by its readers and critics.",
    entries: EMPIRE_100_GREATEST,
  },
  {
    id: "guardian-100-best-21st-century",
    name: "The 100 Best Films of the 21st Century",
    badgeLabel: "Guardian Best 100",
    aliases: ["guardian-100", "best-of-the-21st-century"],
    kind: "curated",
    source: MovieListSource.Editorial,
    sourceName: "The Guardian",
    sourceUrl:
      "https://www.theguardian.com/film/2019/sep/13/100-best-films-movies-of-the-21st-century",
    description:
      "The Guardian's critics rank the finest films released since 2000.",
    entries: GUARDIAN_100_BEST_21ST_CENTURY,
  },
  {
    id: "rt-100-percent-club",
    name: "The 100% Club",
    badgeLabel: "100% on RT",
    aliases: ["100-percent-club", "certified-100"],
    kind: "computed",
    source: MovieListSource.RottenTomatoes,
    sourceName: "Rotten Tomatoes",
    sourceUrl:
      "https://editorial.rottentomatoes.com/guide/movies-100-percent-score-rotten-tomatoes/",
    description:
      "Films that no critic panned — a perfect 100% score on the Tomatometer.",
    // Phrased to read on from "A film makes the list with …".
    criteria: `a 100% Tomatometer score from at least ${RT_MIN_REVIEWS} critics.`,
    // The Fresh tomato marks each film. Deliberately not labelled "Certified
    // Fresh" — that is a separate Rotten Tomatoes certification with its own
    // criteria, which a 100% score does not by itself confer.
    filmBadge: {
      src: "/images/icons/rotten-tomatoes-fresh.png",
      alt: "100% on the Tomatometer",
      width: 23,
      height: 24,
      insetRight: 8,
      insetBottom: 8,
      shadowBlur: 5,
    },
    // Scored by review count: a perfect score across 200 reviews is a far
    // stronger result than the same score across 40, and every score is 100.
    score: (movie) => {
      const critics = movie.rottenTomatoes?.critics?.all;
      if (!critics || critics.score !== 100) return null;
      const reviews = critics.reviews ?? 0;
      return reviews >= RT_MIN_REVIEWS ? reviews : null;
    },
  },
  {
    id: "rt-best-of-all-time",
    name: "The 300 Best Movies of All Time",
    badgeLabel: "RT 300 Best",
    aliases: ["rt-300", "best-movies-of-all-time"],
    kind: "curated",
    source: MovieListSource.RottenTomatoes,
    sourceName: "Rotten Tomatoes",
    sourceUrl:
      "https://editorial.rottentomatoes.com/guide/best-movies-of-all-time/",
    description:
      "Rotten Tomatoes' ranked countdown of the 300 greatest films ever made.",
    entries: RT_BEST_OF_ALL_TIME,
  },
  {
    id: "imdb-top-250",
    name: "The IMDb Top 250",
    badgeLabel: "IMDb Top 250",
    aliases: ["imdb", "top-250"],
    kind: "curated",
    source: MovieListSource.Imdb,
    sourceName: "IMDb",
    sourceUrl: "https://www.imdb.com/chart/top/",
    description:
      "The 250 highest-rated films of all time, as voted for by IMDb users.",
    entries: IMDB_TOP_250,
  },
  {
    id: "letterboxd-top-500",
    name: "Letterboxd's Top 500 Films",
    badgeLabel: "Letterboxd Top 500",
    aliases: ["letterboxd", "letterboxd-500"],
    kind: "curated",
    source: MovieListSource.Letterboxd,
    sourceName: "Letterboxd",
    sourceUrl:
      "https://letterboxd.com/official/list/letterboxds-top-500-films/",
    description:
      "Letterboxd's official chart of the 500 highest-rated narrative feature films.",
    entries: LETTERBOXD_TOP_500,
  },
];

export function findMovieList(slug: string): {
  list: MovieList;
  isAlias: boolean;
} | null {
  const direct = MOVIE_LISTS.find((list) => list.id === slug);
  if (direct) return { list: direct, isAlias: false };

  const byAlias = MOVIE_LISTS.find((list) => list.aliases.includes(slug));
  if (byAlias) return { list: byAlias, isAlias: true };

  return null;
}

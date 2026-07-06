/**
 * Canonical registry of film genres.
 *
 * IDs match the TMDB genre IDs used on `movie.genres` in the combined dataset
 * (see the `genres` map in the data meta file). Because these IDs are stable,
 * every genre gets a permanent landing page at `/genres/<slug>` regardless of
 * whether anything is currently showing — the page renders an empty state when
 * the current data has no films in that genre.
 *
 * The synthetic "Uncategorised" genre is deliberately excluded — it isn't a real
 * genre and shouldn't have a public page.
 */
export type GenreDefinition = {
  /** TMDB genre id, as used on `movie.genres`. */
  id: string;
  /** Display name, matching the dataset's genre name. */
  name: string;
  /** URL slug — the canonical path segment. */
  slug: string;
  /** Alternate slugs that redirect to the canonical page (e.g. "sci-fi"). */
  aliases?: string[];
  /** One or two sentences of unique copy for the meta description, hero blurb,
   *  and JSON-LD description. Kept human-written to avoid thin/duplicate content. */
  seoDescription: string;
};

export const GENRES: GenreDefinition[] = [
  {
    id: "28",
    name: "Action",
    slug: "action",
    seoDescription:
      "High-octane blockbusters, martial arts and stunt-driven spectacle. Find action films showing across London's cinemas, from IMAX multiplexes to independent screens.",
  },
  {
    id: "12",
    name: "Adventure",
    slug: "adventure",
    seoDescription:
      "Epic quests, expeditions and grand escapades. Discover adventure films screening at cinemas across London.",
  },
  {
    id: "16",
    name: "Animation",
    slug: "animation",
    seoDescription:
      "Hand-drawn classics, stop-motion, anime and cutting-edge CG features for all ages. Find animated films showing at cinemas across London.",
  },
  {
    id: "35",
    name: "Comedy",
    slug: "comedy",
    seoDescription:
      "Comedies to make you laugh, from cult favourites to the latest releases. Browse comedy films showing across London's cinemas.",
  },
  {
    id: "80",
    name: "Crime",
    slug: "crime",
    seoDescription:
      "Heists, gangsters, noir and true-crime drama. Find crime films screening at cinemas across London.",
  },
  {
    id: "99",
    name: "Documentary",
    slug: "documentary",
    aliases: ["documentaries"],
    seoDescription:
      "Real stories, portraits and investigations from acclaimed non-fiction filmmakers. Discover documentaries showing across London's cinemas.",
  },
  {
    id: "18",
    name: "Drama",
    slug: "drama",
    seoDescription:
      "Character studies, prestige pictures and emotionally rich storytelling. Browse drama films showing at cinemas across London.",
  },
  {
    id: "10751",
    name: "Family",
    slug: "family",
    seoDescription:
      "Films the whole family can enjoy together, including kids' club and relaxed screenings. Find family films showing across London's cinemas.",
  },
  {
    id: "14",
    name: "Fantasy",
    slug: "fantasy",
    seoDescription:
      "Magic, myth and imagined worlds on the big screen. Discover fantasy films screening at cinemas across London.",
  },
  {
    id: "36",
    name: "History",
    slug: "history",
    seoDescription:
      "Period dramas, biopics and stories drawn from the past. Browse history films showing across London's cinemas.",
  },
  {
    id: "27",
    name: "Horror",
    slug: "horror",
    seoDescription:
      "Chills, thrills and cult classics — from slow-burn dread to all-out scares. Find horror films showing at cinemas across London, including late-night and repertory screenings.",
  },
  {
    id: "10402",
    name: "Music",
    slug: "music",
    seoDescription:
      "Musicals, concert films and music documentaries. Discover music films screening at cinemas across London.",
  },
  {
    id: "9648",
    name: "Mystery",
    slug: "mystery",
    seoDescription:
      "Whodunits, puzzles and slow-unravelling secrets. Browse mystery films showing across London's cinemas.",
  },
  {
    id: "10749",
    name: "Romance",
    slug: "romance",
    seoDescription:
      "Love stories old and new, from swooning classics to modern romances. Find romance films showing at cinemas across London.",
  },
  {
    id: "878",
    name: "Science Fiction",
    slug: "science-fiction",
    aliases: ["sci-fi", "scifi"],
    seoDescription:
      "Space epics, dystopias and mind-bending futures. Discover science fiction films showing across London's cinemas, from 70mm revivals to new releases.",
  },
  {
    id: "53",
    name: "Thriller",
    slug: "thriller",
    seoDescription:
      "Suspense, tension and edge-of-your-seat storytelling. Browse thriller films screening at cinemas across London.",
  },
  {
    id: "10770",
    name: "TV Movie",
    slug: "tv-movie",
    seoDescription:
      "Made-for-television features getting the big-screen treatment. Find TV movies showing at cinemas across London.",
  },
  {
    id: "10752",
    name: "War",
    slug: "war",
    seoDescription:
      "Conflict, combat and stories from the front line. Discover war films screening at cinemas across London.",
  },
  {
    id: "37",
    name: "Western",
    slug: "western",
    seoDescription:
      "Frontier tales, gunslingers and revisionist classics. Browse western films showing across London's cinemas.",
  },
];

/**
 * Resolve a URL slug to a genre, following aliases. Returns the genre and
 * whether the slug was an alias (so the page can emit a canonical redirect).
 */
export function resolveGenre(
  slug: string,
): { genre: GenreDefinition; isAlias: boolean } | null {
  const direct = GENRES.find((g) => g.slug === slug);
  if (direct) return { genre: direct, isAlias: false };

  const byAlias = GENRES.find((g) => g.aliases?.includes(slug));
  if (byAlias) return { genre: byAlias, isAlias: true };

  return null;
}

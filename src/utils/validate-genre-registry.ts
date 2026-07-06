import { GENRES, type GenreDefinition } from "@/data/genres";

type NamedGenre = { name: string };

/** The synthetic genre the pipeline assigns to films with no genre; it has no
 *  public page and is excluded from the registry, so it's ignored here. */
const UNCATEGORISED_NAME = "Uncategorised";

/**
 * Reconciles the dataset's genre metadata (the source of truth that
 * `movie.genres` IDs point at) against the hard-coded registry in
 * `src/data/genres.ts`, returning a list of human-readable problems — empty when
 * the two are in sync.
 *
 * Reports:
 * - a dataset genre with no registry entry (films would exist in a genre that
 *   has no landing page), and
 * - a name that differs between the dataset and the registry (which would show
 *   inconsistent labels between genre pages and movie-page genre pills).
 *
 * Deliberately does NOT report registry genres that are absent from the current
 * data — those intentionally render an empty-state page, since we keep a stable
 * page per genre.
 */
export function findGenreRegistryProblems(
  dataGenres: Record<string, NamedGenre>,
  registry: readonly GenreDefinition[] = GENRES,
): string[] {
  const byId = new Map(registry.map((genre) => [genre.id, genre]));
  const problems: string[] = [];

  for (const [id, genre] of Object.entries(dataGenres)) {
    if (genre.name === UNCATEGORISED_NAME) continue;

    const entry = byId.get(id);
    if (!entry) {
      problems.push(
        `Dataset genre ${id} ("${genre.name}") has no entry in src/data/genres.ts — add it (id, name, slug, seoDescription) so it gets a landing page.`,
      );
    } else if (entry.name !== genre.name) {
      problems.push(
        `Genre ${id} name mismatch: registry "${entry.name}" vs dataset "${genre.name}" — update src/data/genres.ts.`,
      );
    }
  }

  return problems;
}

/**
 * Build-time guard invoked while statically generating the /genres index. Throws
 * when {@link findGenreRegistryProblems} finds any drift, failing the build
 * loudly rather than silently shipping a missing or mislabelled genre page.
 */
export function validateGenreRegistry(
  dataGenres: Record<string, NamedGenre>,
): void {
  const problems = findGenreRegistryProblems(dataGenres);
  if (problems.length > 0) {
    throw new Error(
      `Genre registry is out of sync with the dataset:\n- ${problems.join("\n- ")}`,
    );
  }
}

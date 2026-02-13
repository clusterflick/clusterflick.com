# The Data Pipeline: From Giant JSON to Chunked, Compressed Static Files

## The Input

The pipeline starts with two data sources pulled from separate repos as GitHub
release assets:

1. **`combined-data.json`** — the main cinema dataset from
   `clusterflick/data-combined`, containing all 240+ London cinemas, their
   movies, showings, and individual performances in one monolithic JSON file.
2. **Four review files** from `clusterflick/data-matched` — `imdb.json`,
   `letterboxd.json`, `metacritic.json`, `rottentomatoes.json`.

The combined data has this top-level shape:

```json
{
  "generatedAt": "2026-02-12T...",
  "genres": { "genre-id": { "id": "genre-id", "name": "Drama" } },
  "people": { "person-id": { "id": "person-id", "name": "..." } },
  "venues": { "venue-id": { "id": "venue-id", "name": "Curzon Soho" } },
  "movies": {
    "movie-id": { "title": "...", "showings": {}, "performances": [] }
  }
}
```

The `movies` object is the heavyweight — each movie contains all its showings
(which cinema is showing it, with what URL) and all its performances (every
individual screening time across every cinema). With 240+ cinemas and
potentially thousands of films, this is an enormous object.

## Phase 1: Data Reduction

The processing script (`scripts/process-combined-data.js`) runs a sequence of
five reduction passes, composed functionally:

```javascript
function removeOptionalData(data) {
  return [
    removeShowingOverviews,
    trimRottenTomatoData,
    extractCommonUrlPrefix,
    removeOffAccessiblityIndicators,
    removeIdProperty,
  ].reduce((reducedData, reduction) => reduction(reducedData), data);
}
```

### Pass 1 — Strip Showing Overviews

Each showing has an `overview` sub-object with classification, duration, etc.
This is redundant — the script hoists `classification` and `duration` up to the
movie level (if all showings agree on classification, it becomes the movie's
classification) and then deletes the `overview` from every showing. This strips
duplicated data that was repeated across every showing of the same film.

### Pass 2 — Trim Rotten Tomato Data

Strips fields from Rotten Tomatoes reviews that aren't used on the frontend
(`verified`, `dislikes`, `likes`, `top`).

### Pass 3 — Extract Common URL Prefixes

This is the most interesting reduction. Every showing has a URL and every
performance has a booking URL — thousands of URLs, most sharing common prefixes
like `https://www.picturehouses.com/cinema/` or
`https://www.barbican.org.uk/whats-on/`. The algorithm:

1. Collects **every URL** across showings, performances, and review data.
2. Scans each URL for natural boundary characters (`/`, `?`, `=`, `&`) and
   extracts candidate prefixes at those positions (minimum 20 characters).
3. For each prefix used 2+ times, calculates **net byte savings**:
   `(prefix_length - placeholder_length) × usage_count - storage_cost`.
4. Greedily selects the highest-savings prefixes, skipping any that are subsumed
   by an already-selected prefix.
5. Replaces occurrences with `{index}` placeholders — e.g.,
   `https://www.picturehouses.com/cinema/hackney-picturehouse/film/nosferatu`
   becomes `{3}hackney-picturehouse/film/nosferatu`.
6. Stores the prefix lookup table in `urlPrefixes`.

This also doubles as the merge point where review data from the four
matched-data files gets attached to each movie.

### Pass 4 — Remove False Accessibility Flags

Accessibility flags on performances are stored as booleans
(`audioDescribed: true`, `subtitled: false`). This pass deletes any `false`
flags — their absence implies false, saving bytes.

### Pass 5 — Remove Redundant ID Properties

Since every entity is stored as a key-value pair
(`"abc123": { "id": "abc123", ... }`), the `id` field inside the object is
redundant with its key. This pass strips `id` from genres, venues, people,
movies, and showings — the key itself serves as the identifier.

## Phase 2: Chunking

After reduction, the movies are split into chunks:

```javascript
const MAX_PERFORMANCES_PER_BUCKET = 1000;

Object.entries(movies)
  .sort(([, a], [, b]) => a.normalizedTitle.localeCompare(b.normalizedTitle))
  .forEach(([id, movie]) => {
    const count = Object.keys(movie.performances).length;

    if (
      count > MAX_PERFORMANCES_PER_BUCKET ||
      (countInBucket > 0 && countInBucket + count > MAX_PERFORMANCES_PER_BUCKET)
    ) {
      bucket++;
      countInBucket = 0;
    }

    files[bucket] = files[bucket] || {};
    files[bucket][id] = movie;
    mapping[bucket] = mapping[bucket] || [];
    mapping[bucket].push(id);

    if (count <= MAX_PERFORMANCES_PER_BUCKET) countInBucket += count;
  });
```

The key design decision: **chunks are sized by performance count, not file size
or movie count**. Performances are the largest and most variable part of the
data. A blockbuster showing at 50 cinemas with 5 showtimes each has 250
performances, while an arthouse film at one cinema might have 3. Chunking by
performance count produces roughly equal-sized output files regardless of how
many movies end up in each chunk.

The algorithm:

- Movies are sorted alphabetically by normalized title (deterministic ordering).
- Each bucket holds a maximum of 1,000 performances.
- If a single movie exceeds 1,000 performances, it gets its own bucket.
- A `mapping` object records which movie IDs live in which bucket — this is
  critical for priority loading later.

Currently this produces around 27 chunks.

## Phase 3: Compression and Output

Each chunk and the meta file are compressed using `compress-json`, a library
that optimizes JSON structure (deduplicating repeated values, encoding types
more efficiently). Files are then written to `public/data/` with
content-addressed filenames:

```
data.0.a1b2c3d4e5.json     ← chunk 0 (movies A-B)
data.1.f6g7h8i9j0.json     ← chunk 1 (movies B-C)
...
data.26.k1l2m3n4o5.json    ← chunk 26 (movies Y-Z)
data.meta.p6q7r8s9t0.json  ← metadata
```

The 10-character SHA-256 hash in the filename enables aggressive cache headers —
the content never changes for a given hash, so browsers can cache indefinitely.
When data updates, new filenames are generated.

The **meta file** contains everything except the movies:

```json
{
  "generatedAt": "...",
  "genres": {},
  "people": {},
  "venues": {},
  "urlPrefixes": ["https://www.picturehouses.com/cinema/", "..."],
  "mapping": { "0": ["movie-a", "movie-b"], "1": ["movie-c"] },
  "filenames": ["data.0.a1b2c3d4e5.json", "data.1.f6g7h8i9j0.json"]
}
```

This is small — genres, people, and venues are lightweight lookup tables. The
`mapping` and `filenames` arrays are the index that tells the client where to
find any given movie.

## Phase 4: Runtime Loading (Client-Side)

At build time, `next.config.ts` scans `public/data/` for the meta filename and
bakes it into `NEXT_PUBLIC_DATA_FILENAME` — so the client knows which meta file
to fetch without any server-side logic.

The `CinemaDataProvider` loads data in two stages:

### Stage 1 — Fetch Meta (fast, small payload)

The meta file loads first, giving the app genres, venues, people, and the chunk
index. The UI can start rendering the shell immediately — filter dropdowns,
venue lists, etc. are all available from metadata alone.

### Stage 2 — Fetch Movie Chunks (parallel, progressive)

All chunk files are fetched via `Promise.allSettled`, meaning they load in
parallel and failures are isolated — if one chunk fails, the other 26 still
populate. As each chunk resolves, its movies are merged into state, so the UI
progressively fills in.

There's a **priority loading** path too. When a user navigates directly to a
movie page (e.g., `/movie/nosferatu`), the app uses the `mapping` to identify
which chunk contains that movie, fetches that chunk **first**, then loads the
rest in parallel:

```javascript
let filenameKey;
for (const [key, movieIds] of Object.entries(metaData.mapping)) {
  if (movieId && movieIds.includes(movieId)) {
    filenameKey = parseInt(key, 10);
    break;
  }
}
if (filenameKey !== undefined) {
  prioritisedFilename = metaData.filenames[filenameKey];
  await getMovieData(prioritisedFilename).then(processAndUpdateMovies);
}
```

This means the movie the user came to see renders as fast as possible, without
waiting for the entire dataset.

## Phase 5: Data Hydration

As chunks arrive, each batch of movies goes through post-processing:

1. **`stripPastPerformances`** — Removes any performances before today's
   midnight (London time). This also prunes any showings and movies that have no
   remaining future performances, keeping the dataset current.
2. **`assignUncategorisedGenre`** — Ensures every movie has at least one valid
   genre for filtering purposes.
3. **`expandData`** — Re-adds the `id` property that was stripped during Phase
   1, restoring `"abc123": { id: "abc123", ... }` so components can pass IDs
   around naturally.
4. **URL hydration** happens on-demand via `hydrateUrl` — when a component needs
   to display or link to a URL, `{3}hackney-picturehouse/film/nosferatu` is
   expanded back to its full form using the `urlPrefixes` lookup from metadata.

## Summary

| Concern                | Solution                                                   |
| ---------------------- | ---------------------------------------------------------- |
| Large monolithic input | Split into ~27 chunks + 1 meta file                        |
| Chunk sizing           | By performance count (max 1,000), not file size            |
| Redundant data         | Strip showing overviews, IDs, false flags                  |
| URL bloat              | Extract shared prefixes, replace with `{n}` placeholders   |
| Payload compression    | `compress-json` for structural deduplication               |
| Cache busting          | Content-addressed filenames (SHA-256 hash)                 |
| Initial load speed     | Meta loads first (small); movie chunks load in parallel    |
| Deep link performance  | Priority loading fetches the relevant chunk first          |
| Resilience             | `Promise.allSettled` — partial failures don't block the UI |
| Stale data             | Past performances pruned at load time, not build time      |

The net effect: instead of a single enormous JSON blocking the initial render,
users get the UI shell almost immediately from the meta file, then movie data
streams in progressively across ~27 parallel requests — with the most relevant
chunk prioritized if they deep-linked to a specific film.

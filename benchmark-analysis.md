# Benchmark Results: Do the Data Pipeline Optimisations Actually Help?

## Raw Results

| Variant                            | Files | Raw total | Gzipped total | Raw Δ              | Gzip Δ            |
| ---------------------------------- | ----- | --------- | ------------- | ------------------ | ----------------- |
| All optimisations (baseline)       | 28    | 4.85 MB   | 1.76 MB       | —                  | —                 |
| Without compress-json              | 28    | 10.97 MB  | 1.43 MB       | +125.9% (+6.11 MB) | -18.5% (-333 KB)  |
| Without removing IDs               | 28    | 4.91 MB   | 1.80 MB       | +1.2% (+59.8 KB)   | +2.4% (+43.4 KB)  |
| Without removing false a11y flags  | 28    | 4.85 MB   | 1.76 MB       | ~0%                | ~0%               |
| Without URL prefix extraction      | 28    | 6.52 MB   | 1.84 MB       | +34.3% (+1.67 MB)  | +5.0% (+89.5 KB)  |
| Without trimming RT data           | 28    | 4.85 MB   | 1.76 MB       | ~0%                | ~0%               |
| Without removing showing overviews | 28    | 5.07 MB   | 1.86 MB       | +4.5% (+222.5 KB)  | +6.1% (+109.1 KB) |
| No optimisations at all            | 28    | 14.13 MB  | 1.65 MB       | +191.1% (+9.28 MB) | -6.0% (-108 KB)   |

Total savings (all optimisations vs none):

- **Raw:** 14.13 MB → 4.85 MB (-65.6%, saved 9.28 MB)
- **Gzipped:** 1.65 MB → 1.76 MB (+6.4%, saved -108 KB)

## The Headline Finding

All optimisations combined make the gzipped output 6.4% **larger**, not smaller.
The fully optimised pipeline produces 1.76 MB gzipped, while no optimisations at
all produces 1.65 MB gzipped. The optimisations are collectively
counterproductive once HTTP compression enters the picture.

## The Culprit: compress-json

`compress-json` is the standout. It reduces the raw JSON dramatically (10.97 MB
→ 4.85 MB), but dropping it _shrinks_ the gzipped output by 18.5% (1.76 MB →
1.43 MB). That's 333 KB saved by _removing_ an optimisation.

`compress-json` works by structurally transforming JSON — deduplicating repeated
values into lookup tables, encoding types differently. But gzip already excels
at exactly this: finding repeated byte sequences and replacing them with
back-references. The two approaches fight each other. `compress-json`'s
transformed structure is actually _harder_ for gzip to compress than plain
repetitive JSON.

## Ranking Each Optimisation by Gzipped Impact

What users actually download is gzipped, so this is the column that matters:

| Optimisation               | Gzip impact              | Verdict                                         |
| -------------------------- | ------------------------ | ----------------------------------------------- |
| `compress-json`            | **+18.5% (hurts!)**      | Actively harmful with gzip                      |
| Removing showing overviews | **-6.1% (saves 109 KB)** | Best win — removes genuinely redundant data     |
| URL prefix extraction      | **-5.0% (saves 90 KB)**  | Solid — even gzip benefits from shorter strings |
| Removing IDs               | **-2.4% (saves 43 KB)**  | Modest but real                                 |
| Removing false a11y flags  | **~0%**                  | Negligible                                      |
| Trimming RT data           | **~0%**                  | Negligible                                      |

## Why the Zero-Impact Ones Don't Matter

The two negligible optimisations make sense:

- **False a11y flags** are sparse booleans — very few performances have
  accessibility data at all, so deleting `false` values removes almost nothing.
- **Trimming RT data** deletes a handful of fields (`verified`, `dislikes`,
  `likes`, `top`) per movie. These are small values and many entries may not
  have them.

## The Implied Optimal Pipeline

The "without compress-json" row still has all the other optimisations applied.
That lands at **1.43 MB gzipped** — 19% smaller than the current 1.76 MB,
achieved by _deleting_ code.

## Why compress-json Has No Upside Here

At first glance you might think there's a tradeoff: larger over the wire without
`compress-json`, but smaller in-memory with it. That's not really true. The
compressed form is only a brief intermediate — the client immediately calls
`decompress()` to expand it back to the full structure. The actual data
lifecycle is:

1. **Over the wire:** gzipped bytes (the browser handles this transparently via
   native code)
2. **After HTTP decompression:** the raw JSON string (4.85 MB with
   `compress-json`, 10.97 MB without)
3. **After `JSON.parse()`:** the parsed object in memory
4. **After `decompress()`:** the full expanded object — identical either way

With `compress-json`, step 3 produces a smaller intermediate object, but step 4
immediately inflates it back to the same final size. Without `compress-json`,
you skip step 4 entirely — `JSON.parse()` gives you the final object directly.

The cost comparison makes this worse than it appears. Gzip decompression is
built into every browser's network stack — it's native C/C++ code that runs
before JavaScript even sees the response. It's free from the application's
perspective. `compress-json` on the other hand requires:

- **Bundle weight:** the `decompress` function ships as part of the JavaScript
  bundle — library code every user downloads
- **Main-thread CPU:** decompression runs in JavaScript, blocking the main
  thread (or at least consuming JS runtime)
- **Per-chunk cost:** `decompress()` runs for every chunk as it arrives, adding
  latency to the progressive loading

So the current pipeline pays three times for `compress-json`: 333 KB larger
gzipped transfer, extra JS bundle weight for the library, and CPU time running
`decompress()` on every chunk. In exchange, the only benefit is a slightly
smaller intermediate object between `JSON.parse()` and `decompress()` — which is
immediately expanded and discarded.

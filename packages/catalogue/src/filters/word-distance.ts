/**
 * Fuzzy string matching over whole words, shared by the title corrections and
 * the people lookup.
 */

/**
 * Shortest query worth matching fuzzily.
 *
 * The floor is empirical, not aesthetic: below it, a one-edit budget is a
 * quarter of the query, and the dataset holds enough short title words that
 * something always lands within it.
 *
 * Five is where the real cases start — "akera" → Akira and "bilss" → Bliss are
 * both five — so it cannot go higher without losing them. Short queries stay
 * inherently speculative as a result: any five-letter string one edit from a
 * title word will draw an offer, and nothing in the query distinguishes a
 * genuine slip from a coincidence. They are phrased as a question and carry a
 * result count for exactly that reason.
 */
export const MIN_FUZZY_LENGTH = 5;

/**
 * How many edits a query of this length may be wrong by: one per six
 * characters, so a short query is never rewritten wholesale.
 */
export const editBudgetFor = (needle: string): number =>
  Math.min(3, Math.max(1, Math.round(needle.length / 6)));

/**
 * Optimal string alignment distance between two whole strings — Levenshtein
 * plus a transposition operation, capped at `max`.
 *
 * The transposition case is not a refinement, it is the main event. Swapping
 * two adjacent letters is the most common way to mistype a word, and plain
 * Levenshtein charges it as two substitutions — which put "ornage" → "orange"
 * and "bilss" → "bliss" out of reach of any budget a short query can afford.
 *
 * Returns `max + 1` rather than the true distance once the answer is known to
 * exceed the cap, so callers must compare against `max`, never between two
 * rejected values.
 */
export function boundedEditDistance(a: string, b: string, max: number): number {
  const m = a.length;
  const n = b.length;
  // Length alone can rule it out: each edit changes the length by at most one.
  if (Math.abs(m - n) > max) return max + 1;

  let twoBack: number[] = [];
  let previous = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i += 1) {
    const current = new Array<number>(n + 1);
    current[0] = i;
    let rowBest = current[0];

    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let distance = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance = Math.min(distance, twoBack[j - 2] + 1);
      }
      current[j] = distance;
      if (distance < rowBest) rowBest = distance;
    }

    // Every later row is at least this good, so the cap can never be met again.
    if (rowBest > max) return max + 1;

    twoBack = previous;
    previous = current;
  }

  return previous[n];
}

/**
 * The closest any run of whole words in `words` comes to `needle`.
 *
 * Anchoring to word boundaries is what keeps corrections honest. The previous
 * free-floating substring match let a query land anywhere, so "ornage" scored
 * one edit against "short**s for age**s 4+" — three words deep, mid-word at
 * both ends — and beat "A Clockwork Orange". People mistype words, not
 * arbitrary character windows.
 *
 * Runs are joined without separators so the comparison stays in the same
 * alphabet as the query, and only runs whose length is within `max` of the
 * query are scored — anything else cannot possibly come within budget.
 */
export function bestWordRunDistance(
  needle: string,
  words: string[],
  max: number,
): number {
  const shortest = needle.length - max;
  const longest = needle.length + max;
  let best = max + 1;

  for (let start = 0; start < words.length; start += 1) {
    let run = "";
    for (let end = start; end < words.length; end += 1) {
      run += words[end];
      // Extending only makes it longer, so nothing further from this start can
      // come back into range.
      if (run.length > longest) break;
      if (run.length < shortest) continue;

      const distance = boundedEditDistance(needle, run, max);
      if (distance < best) best = distance;
      if (best === 0) return 0;
    }
  }

  return best;
}

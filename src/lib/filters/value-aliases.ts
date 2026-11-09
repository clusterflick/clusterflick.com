import { AccessibilityFeature, Category, OccasionType } from "@/types";

// The words people use for filter values, shared by the zero-result
// suggestions (which read a whole query as naming a value) and the overlay's
// search menu (which offers values as the query is typed).

/**
 * Other words for a value — what people type rather than what the pill says.
 *
 * Aliases rather than an edit budget, because the words worth catching are
 * rarely spellings of the label: "subs", "captioned" and "SDH" are all
 * subtitles and none is within any distance of it. Plurals and past tenses
 * ("subtitle", "subtitled") need no entry here; {@link foldSuffix} covers them.
 *
 * Accessibility is keyed by feature and genres by name, since genre ids come
 * from the dataset.
 */
export const ACCESSIBILITY_ALIASES: Record<AccessibilityFeature, string[]> = {
  [AccessibilityFeature.AudioDescription]: ["audio described", "AD"],
  [AccessibilityFeature.BabyFriendly]: [
    "baby",
    "parent and baby",
    "parent and child",
    "carer and baby",
  ],
  // "dog" and "dogs" already reach the label: it's a run of its words, and
  // endings fold
  [AccessibilityFeature.DogFriendly]: ["dogs welcome", "bring your dog"],
  [AccessibilityFeature.HardOfHearing]: ["HOH"],
  [AccessibilityFeature.Relaxed]: [
    "relaxed screening",
    "autism friendly",
    "sensory friendly",
  ],
  [AccessibilityFeature.Subtitled]: [
    "subs",
    "captioned",
    "captions",
    "closed captions",
    "SDH",
  ],
};

/**
 * The words people search an occasion by. The pills keep the short forms the
 * performance tags use ("Intro", "Q&A"), so the long ones are aliases here -
 * "introduction" is how a reader asks for an intro.
 */
export const OCCASION_ALIASES: Record<OccasionType, string[]> = {
  [OccasionType.LiveScore]: [
    "live music",
    "live accompaniment",
    "live soundtrack",
  ],
  [OccasionType.Intro]: ["introduction", "introduced", "introduce"],
  [OccasionType.QAndA]: [
    "q and a",
    "qa",
    "screentalk",
    "question and answer",
    "questions and answers",
  ],
  // "conversation", "panel" and "guest" already reach their labels: each is
  // a run of the label's words.
  [OccasionType.InConversation]: ["talk"],
  [OccasionType.Panel]: ["discussion", "debate"],
  [OccasionType.GuestAppearance]: ["special guest", "in person"],
  [OccasionType.Premiere]: [
    "uk premiere",
    "london premiere",
    "world premiere",
    "first screening",
  ],
  [OccasionType.Preview]: [
    "preview screening",
    "sneak preview",
    "advance screening",
  ],
};

export const GENRE_ALIASES: Record<string, string[]> = {
  "science fiction": ["sci-fi", "scifi"],
  animation: ["animated"],
  history: ["historical"],
  documentary: ["docs"],
};

export const CATEGORY_ALIASES: Partial<Record<Category, string[]>> = {
  // "quizzes" folds to "quizz", which "quiz" cannot reach.
  [Category.Quiz]: ["quiz"],
};

/**
 * Folds the common English endings off a normalised term, so "subtitle",
 * "subtitled" and "subtitles" all meet at "subtitl".
 *
 * Applied to both sides of a comparison, so it only has to be consistent, not
 * linguistically right — and it only ever compares against a vocabulary of a
 * few dozen values, where two different words folding together is harmless.
 * Anything that would leave fewer than three letters is left alone, so "ad"
 * and "tv" stay themselves.
 */
export function foldSuffix(term: string): string {
  const rules: [RegExp, string][] = [
    [/ies$/, "y"],
    [/es$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];
  let folded = term;
  for (const [pattern, replacement] of rules) {
    if (pattern.test(folded)) {
      folded = folded.replace(pattern, replacement);
      break;
    }
  }
  folded = folded.replace(/e$/, "");
  return folded.length >= 3 ? folded : term;
}

/**
 * Bidirectional number ↔ word conversion, so "101 Dalmatians" and "One Hundred
 * and One Dalmatians" find each other.
 *
 * Hand-rolled rather than pulled from a library because we need *several*
 * spellings per number, not one canonical string: upstream builds
 * movie.normalizedTitle by dropping "and" ("one hundred one dalmatians") while
 * movie.title keeps it ("One Hundred and One Dalmatians"), and both have to
 * match. Film titles never exceed four digits, so 0–9999 is ample.
 */

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const MAX_VALUE = 9999;

/** Spellings of a number under 100. Always exactly one. */
const spellBelowHundred = (value: number): string =>
  value < 20
    ? ONES[value]
    : `${TENS[Math.floor(value / 10)]}${value % 10 ? ` ${ONES[value % 10]}` : ""}`;

/**
 * Every reasonable spelling of a number, e.g. 101 → ["one hundred and one",
 * "one hundred one"]. Returns an empty array for values we don't spell out.
 */
export const numberToWords = (value: number): string[] => {
  if (!Number.isInteger(value) || value < 0 || value > MAX_VALUE) return [];
  if (value < 100) return [spellBelowHundred(value)];

  const unit = value >= 1000 ? 1000 : 100;
  const unitName = unit === 1000 ? "thousand" : "hundred";
  const head = `${spellBelowHundred(Math.floor(value / unit))} ${unitName}`;
  const remainder = value % unit;

  if (remainder === 0) return [head];

  // The "and" connector is optional in the tail ("two thousand and one" /
  // "two thousand one"), and the tail itself may spell out further.
  return numberToWords(remainder).flatMap((tail) => [
    `${head} and ${tail}`,
    `${head} ${tail}`,
  ]);
};

const WORD_VALUES = new Map<string, number>([
  ...ONES.map((word, index): [string, number] => [word, index]),
  ...TENS.flatMap((word, index): [string, number][] =>
    word ? [[word, index * 10]] : [],
  ),
]);

const NUMBER_WORD = `(?:${[...WORD_VALUES.keys()].join("|")}|hundred|thousand|and)`;
const NUMBER_PHRASE = new RegExp(
  `\\b${NUMBER_WORD}(?:[\\s-]+${NUMBER_WORD})*\\b`,
  "g",
);

/** Sum a run of number words, e.g. "one hundred and one" → 101. */
const parseNumberPhrase = (phrase: string): number | null => {
  let total = 0;
  let current = 0;
  let sawNumber = false;

  for (const word of phrase.split(/[\s-]+/)) {
    if (word === "and") continue;
    if (word === "hundred" || word === "thousand") {
      // A multiplier with nothing before it ("hundred") isn't a number we can use
      if (!sawNumber) return null;
      current = (current || 1) * (word === "hundred" ? 100 : 1000);
      if (word === "thousand") {
        total += current;
        current = 0;
      }
      continue;
    }
    const value = WORD_VALUES.get(word);
    if (value === undefined) return null;
    sawNumber = true;
    current += value;
  }

  // A phrase of pure connectors ("and" in "Romeo and Juliet") is not a number
  if (!sawNumber) return null;

  const result = total + current;
  return result > MAX_VALUE ? null : result;
};

/**
 * Replace spelled-out numbers with digits, e.g.
 * "One Hundred and One Dalmatians" → "101 Dalmatians".
 */
export const wordsToNumbers = (str: string): string =>
  str.replace(NUMBER_PHRASE, (phrase) => {
    const value = parseNumberPhrase(phrase);
    return value === null ? phrase : String(value);
  });

/**
 * Replace digits with their spellings, returning one string per combination of
 * spellings. Capped so a title full of numbers can't explode the variant set.
 */
export const numbersToWords = (str: string, limit = 4): string[] => {
  const results = [str];

  for (const match of [...str.matchAll(/\b\d{1,4}\b/g)].reverse()) {
    const spellings = numberToWords(Number(match[0]));
    if (spellings.length === 0) continue;

    const replaced = results.flatMap((result) =>
      spellings.map(
        (spelling) =>
          result.slice(0, match.index) +
          spelling +
          result.slice(match.index + match[0].length),
      ),
    );
    results.length = 0;
    results.push(...replaced.slice(0, limit));
  }

  return results;
};

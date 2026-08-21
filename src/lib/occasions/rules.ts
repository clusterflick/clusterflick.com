/**
 * What makes a performance more than a screening.
 *
 * There is no structured field for "the director is coming". The only evidence
 * is text a venue wrote about one performance, and it is 300 venues writing in
 * 300 styles — so detection is a rule table over the two free-text fields.
 *
 * **Both fields are read together**, because the signal is split almost evenly
 * between them: of the guest screenings in a recent dataset, 104 said so only
 * in the showing title, 98 only in the performance notes, and 43 in both. The
 * two search filters are AND'd, so no query over either field alone reaches
 * much past half of them — which is the whole reason this exists rather than a
 * saved search.
 *
 * The table is deliberately small and legible. A rule whose match cannot be
 * turned into a label a reader would recognise has no business promoting a
 * screening to the home page.
 */

/** The kinds of occasion worth telling someone about, most special first. */
export enum OccasionKind {
  /** A musician playing along with the film, usually a silent. */
  LiveScore = "live-score",
  /** Someone in the room: Q&A, in conversation, a named introduction. */
  Guest = "guest",
  /** First UK/London showing. */
  Premiere = "premiere",
  /** An introduction with nobody named — often house style, see the scoring. */
  Intro = "intro",
  /** Showing ahead of general release. */
  Preview = "preview",
}

export interface OccasionMatch {
  kind: OccasionKind;
  /** Reader-facing summary of the occasion, e.g. "Q&A with Mark Gatiss". */
  label: string;
  /** Whether a person was named — the strongest evidence of a one-off. */
  named: boolean;
}

type OccasionRule = {
  kind: OccasionKind;
  pattern: RegExp;
  /**
   * A fixed label, or one built from the rule's first capture group.
   */
  label: string | ((capture: string) => string);
  /**
   * Whether the capture is a person. Defaults to true for a builder label —
   * set false where the capture is a known word (a role, a region), which is
   * printed as-is rather than run through the name cleaning.
   */
  named?: boolean;
  /** Cancels the match when this also appears — the note argues against itself. */
  unless?: RegExp;
};

/**
 * A pre-recorded introduction plays before most screenings in a season, so it
 * is programming, not an occasion. It cancels every guest and intro rule
 * rather than the performance as a whole, so a pre-recorded intro before a
 * live-scored film doesn't take the live score down with it.
 */
const NOT_IN_THE_ROOM = /pre-?recorded|recorded (intro|introduction|message)/i;

/**
 * Chain "preview" pricing and membership perks. These describe a ticket, not
 * an event — and they run every week.
 */
const ROUTINE_PREVIEW =
  /members|membership|£\s?\d|priority booking|discounted|unlimited card/i;

/**
 * A trailing name, stopped at whatever ends the phrase. Kept greedy enough for
 * "Claude Chabrol's daughter and collaborator Cécile Maistre-Chabrol" and
 * short enough that a run-on sentence can't become a label.
 *
 * Newlines and `+` are hard stops. The haystack is the showing title and the
 * performance notes joined, and a title that ends in a name runs straight into
 * whatever the venue wrote next — "Q&A with Samira Ahmed" plus a notes field
 * beginning "This screening features…" is one string, and without the stop the
 * capture swallows both.
 */
const NAME = String.raw`([^.,;:|+\n(\[\]]{3,70})`;

/**
 * Ordered most specific first — the first rule to match a kind wins, so a
 * named guest beats the bare "Q&A" fallback.
 */
const RULES: OccasionRule[] = [
  // — Live accompaniment ————————————————————————————————————————————————
  {
    kind: OccasionKind.LiveScore,
    pattern: new RegExp(
      String.raw`\blive (?:score|music|accompaniment|soundtrack)\s+(?:by|from|with)\s+` +
        NAME,
      "i",
    ),
    label: (name) => `Live score by ${name}`,
  },
  {
    kind: OccasionKind.LiveScore,
    pattern:
      /\blive (?:score|scored|music|accompaniment|band|orchestra|soundtrack)\b/i,
    label: "Live score",
  },

  // — Someone in the room ———————————————————————————————————————————————
  {
    kind: OccasionKind.Guest,
    pattern: new RegExp(
      String.raw`\b(?:q\s*&\s*a|q\s*and\s*a)\s+(?:with|w/)\s+` + NAME,
      "i",
    ),
    label: (name) => `Q&A with ${name}`,
    unless: NOT_IN_THE_ROOM,
  },
  {
    kind: OccasionKind.Guest,
    pattern: new RegExp(String.raw`\bin conversation with\s+` + NAME, "i"),
    label: (name) => `In conversation with ${name}`,
    unless: NOT_IN_THE_ROOM,
  },
  {
    kind: OccasionKind.Guest,
    pattern: new RegExp(
      String.raw`\b(?:extended\s+)?intro(?:duction)?\s+(?:by|from|with)\s+` +
        NAME,
      "i",
    ),
    label: (name) => `Intro by ${name}`,
    unless: NOT_IN_THE_ROOM,
  },
  {
    kind: OccasionKind.Guest,
    // "Director Q&A", "Cast and crew Q&A" — no name, but a stated role is
    // still a person in the room rather than a house habit.
    pattern:
      /\b(director|writer|producer|composer|cast|crew|editor|star|author)(?:'s)?(?:\s+and\s+\w+)?\s+(?:q\s*&\s*a|intro(?:duction)?|talk)\b/i,
    label: (role) => `${capitalise(role)} Q&A`,
    named: false,
    unless: NOT_IN_THE_ROOM,
  },
  {
    kind: OccasionKind.Guest,
    pattern: /\bq\s*&\s*a\b|\bq\s*and\s*a\b/i,
    label: "Q&A",
    unless: NOT_IN_THE_ROOM,
  },
  {
    kind: OccasionKind.Guest,
    pattern:
      /\bin (?:person|attendance)\b|\bpanel discussion\b|\bmasterclass\b/i,
    label: "With a guest",
    unless: NOT_IN_THE_ROOM,
  },

  // — Premieres and previews ————————————————————————————————————————————
  {
    kind: OccasionKind.Premiere,
    pattern: /\b(uk|european|world|london|british)\s+premiere\b/i,
    label: (region) =>
      `${region.length === 2 ? region.toUpperCase() : capitalise(region)} premiere`,
    named: false,
  },
  {
    kind: OccasionKind.Preview,
    pattern: /\bpreview\b/i,
    label: "Preview screening",
    unless: ROUTINE_PREVIEW,
  },

  // — Introductions with nobody named ———————————————————————————————————
  {
    kind: OccasionKind.Intro,
    pattern: /\bintroduc(?:tion|ed)\b|(?:^|\W)intro(?:\W|$)/i,
    label: "With an introduction",
    unless: NOT_IN_THE_ROOM,
  },
];

const capitalise = (word: string) =>
  `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;

/**
 * Some venues write their listings in capitals, which makes a label shout in a
 * row where nothing else does. Only a capture with no lower case at all is
 * touched, and short words are left alone so BFI and UK survive intact.
 */
function softenShouting(name: string): string {
  if (/\p{Ll}/u.test(name)) return name;
  return name.replace(/\p{L}[\p{L}'’-]*/gu, (word) =>
    word.length <= 3
      ? word
      : `${word[0]}${word.slice(1).toLocaleLowerCase("en-GB")}`,
  );
}

/** Longest label fragment kept from a capture before it's trimmed to a word. */
const MAX_NAME_LENGTH = 44;

/**
 * Tidy a captured name into something printable, or reject it.
 *
 * Requires an initial capital: every real name and title has one, and it is
 * the cheapest guard against a rule swallowing the rest of a sentence
 * ("Q&A with tickets available on the door").
 */
function cleanName(raw: string): string | null {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  const withoutTrailingJoin = collapsed
    .replace(/\s+(?:and|with|plus|&)$/i, "")
    .trim();
  if (withoutTrailingJoin.length < 3) return null;
  if (!/^[\p{Lu}]/u.test(withoutTrailingJoin)) return null;

  const trimmed = softenShouting(withoutTrailingJoin);
  if (trimmed.length <= MAX_NAME_LENGTH) return trimmed;

  const cut = trimmed.slice(0, MAX_NAME_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * One cheap test that every rule in the table implies, so the common case — a
 * listing that says nothing but the film's name — costs a single pass instead
 * of a dozen. The engine runs this over every upcoming performance in London,
 * twice: once at build time and again on the client.
 */
const ANY_SIGNAL =
  /q\s*&\s*a|q\s*and\s*a|intro|live|premiere|preview|conversation|in person|attendance|panel|masterclass/i;

/**
 * Every occasion the text describes, at most one per kind. Ordered as the rule
 * table is, so callers reading `[0]` get the most specific kind that matched.
 */
export function matchOccasions(text: string): OccasionMatch[] {
  if (!text || !ANY_SIGNAL.test(text)) return [];

  const matches: OccasionMatch[] = [];
  const seen = new Set<OccasionKind>();

  for (const rule of RULES) {
    if (seen.has(rule.kind)) continue;
    if (rule.unless?.test(text)) continue;

    const match = text.match(rule.pattern);
    if (!match) continue;

    if (typeof rule.label === "string") {
      seen.add(rule.kind);
      matches.push({ kind: rule.kind, label: rule.label, named: false });
      continue;
    }

    const capture = match[1] ?? "";
    if (rule.named === false) {
      seen.add(rule.kind);
      matches.push({
        kind: rule.kind,
        label: rule.label(capture),
        named: false,
      });
      continue;
    }

    const name = cleanName(capture);
    // A capture that doesn't survive cleaning isn't a name; fall through to a
    // less specific rule for the same kind rather than inventing a label.
    if (!name) continue;

    seen.add(rule.kind);
    matches.push({ kind: rule.kind, label: rule.label(name), named: true });
  }

  // "+ intro by Mark Gatiss" is one occasion, not an introduction and a guest.
  // The bare intro rule exists for the screenings where nobody is named, so it
  // has nothing to add once a guest has been found in the same text.
  if (seen.has(OccasionKind.Guest)) {
    return matches.filter((match) => match.kind !== OccasionKind.Intro);
  }

  return matches;
}

import type { MoviePerformanceOccasions, PremiereRegion } from "@/types";

/**
 * What makes a performance more than a screening.
 *
 * The pipeline reads it from everything a venue wrote about the performance -
 * its listing data, the showing title, the performance notes and the
 * description - and publishes it as `performance.occasions`. Reading the
 * description is what this site couldn't do: the ICA's "The Eel" says nothing
 * in its title, while its page says "This screening will be introduced by
 * Benjamin Crais". The rules, and the cases that shaped them, live with the
 * pipeline (`docs/occasions.md` in clusterflick/scripts).
 *
 * This file only turns that record into the kinds this site ranks and the
 * labels it shows. Whether an occasion is rare enough to promote is decided in
 * `./index.ts`.
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

/**
 * Some venues write their listings in capitals, which makes a label shout in a
 * row where nothing else does. Only a name with no lower case at all is
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

/** Longest run of names kept in a label before it's trimmed to a word. */
const MAX_NAME_LENGTH = 44;

/** Cut a name that is too long on its own at a word, so it fits a subtitle. */
function trimName(name: string): string {
  if (name.length <= MAX_NAME_LENGTH) return name;
  const cut = name.slice(0, MAX_NAME_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * The names as one phrase: "Mike Leigh", "Mike Leigh and Marianne
 * Jean-Baptiste", or the first and "others" beyond two - or when two won't
 * fit, since a poster subtitle has room for one line and half a name reads
 * worse than none.
 */
function formatNames(names: string[]): string {
  const [first, second] = names.map(softenShouting);
  if (names.length === 1) return trimName(first);
  const pair = `${first} and ${second}`;
  if (names.length === 2 && pair.length <= MAX_NAME_LENGTH) return pair;
  return `${trimName(first)} and others`;
}

const REGION_LABEL: Record<PremiereRegion, string> = {
  uk: "UK",
  london: "London",
  european: "European",
  world: "World",
  international: "International",
};

type GuestForm = "qAndA" | "inConversation" | "intro" | "panel";

/**
 * How each way of being in the room reads, named and not. Ordered as a label
 * is chosen: a named guest of any form beats an unnamed one, and among equals
 * the more specific form wins.
 */
const GUEST_FORMS: {
  key: GuestForm | "guestAppearance";
  named: (names: string) => string;
  unnamed: string | null;
}[] = [
  { key: "qAndA", named: (names) => `Q&A with ${names}`, unnamed: "Q&A" },
  {
    key: "inConversation",
    named: (names) => `In conversation with ${names}`,
    unnamed: "In conversation",
  },
  // An unnamed intro is its own, weaker kind — see `Intro` below.
  { key: "intro", named: (names) => `Intro by ${names}`, unnamed: null },
  {
    key: "panel",
    named: (names) => `Panel with ${names}`,
    unnamed: "Panel discussion",
  },
  {
    key: "guestAppearance",
    named: (names) => `With ${names}`,
    unnamed: "With a guest",
  },
];

function guestOccasion(
  occasions: MoviePerformanceOccasions,
): OccasionMatch | null {
  for (const { key, named } of GUEST_FORMS) {
    const value = occasions[key];
    if (value && value !== true && value.guests.length > 0) {
      return {
        kind: OccasionKind.Guest,
        label: named(formatNames(value.guests)),
        named: true,
      };
    }
  }
  for (const { key, unnamed } of GUEST_FORMS) {
    if (occasions[key] && unnamed) {
      return { kind: OccasionKind.Guest, label: unnamed, named: false };
    }
  }
  return null;
}

/**
 * Every occasion the performance has, at most one per kind, ordered as
 * {@link OccasionKind} is — so callers reading `[0]` get the most special.
 */
export function matchOccasions(
  occasions: MoviePerformanceOccasions | undefined,
): OccasionMatch[] {
  if (!occasions) return [];
  const matches: OccasionMatch[] = [];

  const { liveScore, premiere, intro, preview } = occasions;
  if (liveScore) {
    matches.push(
      liveScore === true
        ? { kind: OccasionKind.LiveScore, label: "Live score", named: false }
        : {
            kind: OccasionKind.LiveScore,
            label: `Live score by ${formatNames(liveScore.performers)}`,
            named: true,
          },
    );
  }

  const guest = guestOccasion(occasions);
  if (guest) matches.push(guest);

  if (premiere) {
    matches.push({
      kind: OccasionKind.Premiere,
      label:
        premiere === true
          ? "Premiere"
          : `${REGION_LABEL[premiere.region]} premiere`,
      named: false,
    });
  }

  // "+ intro by Mark Gatiss" is one occasion, not an introduction and a guest.
  // The unnamed intro is for the screenings where nobody is in the room by
  // name, so it has nothing to add once a guest has been found.
  if (intro && !guest) {
    matches.push({
      kind: OccasionKind.Intro,
      label: "With an introduction",
      named: false,
    });
  }

  if (preview) {
    matches.push({
      kind: OccasionKind.Preview,
      label: "Preview screening",
      named: false,
    });
  }

  return matches;
}

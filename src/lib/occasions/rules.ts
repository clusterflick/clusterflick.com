import {
  OccasionType,
  type MoviePerformanceOccasions,
  type PremiereRegion,
} from "@/types";
import { OCCASION_LABELS } from "@/utils/occasion-labels";

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

type OccasionKey = keyof MoviePerformanceOccasions;

/**
 * The order a performance's occasion tags are listed in, and the filter's
 * pills: the enum's order, most special first.
 */
export const OCCASION_ORDER = Object.values(OccasionType);
// The enum's values are the published field's keys.
const TAG_ORDER = OCCASION_ORDER as OccasionKey[];

/** How each occasion reads in full once someone is named. */
const NAMED_DETAIL: Partial<Record<OccasionKey, (names: string) => string>> = {
  liveScore: (names) => `Live score by ${names}`,
  intro: (names) => `Intro by ${names}`,
  qAndA: (names) => `Q&A with ${names}`,
  inConversation: (names) => `In conversation with ${names}`,
  panel: (names) => `Panel with ${names}`,
  guestAppearance: (names) => `With ${names}`,
};

function namesOf(value: unknown): string[] {
  if (!value || value === true || typeof value !== "object") return [];
  const details = value as { guests?: string[]; performers?: string[] };
  return details.guests ?? details.performers ?? [];
}

/** Every name, in full: "A", "A and B", "A, B and C". */
function listNames(names: string[]): string {
  const softened = names.map(softenShouting);
  if (softened.length <= 1) return softened.join("");
  return `${softened.slice(0, -1).join(", ")} and ${softened.at(-1)}`;
}

/**
 * Every occasion on a performance as a tag: what it is, never who - "Panel
 * discussion", "Intro", "UK premiere". Who goes on a line of its own
 * ({@link getOccasionDetails}), since a tag holding "Panel with Charlotte
 * Harrison and Tim Robey" wrapped and stopped reading as a tag.
 *
 * Unlike {@link matchOccasions} this keeps them all, intro and Q&A alike, and
 * says nothing about rarity: a tag is a fact about one showing, like
 * "Subtitled", so every introduced screening gets one.
 */
export function getOccasionTags(
  occasions: MoviePerformanceOccasions | undefined,
): string[] {
  if (!occasions) return [];
  return TAG_ORDER.flatMap((key) => {
    const value = occasions[key];
    if (!value) return [];
    if (key === "premiere" && value !== true) {
      const { region } = value as { region: PremiereRegion };
      return [`${REGION_LABEL[region]} premiere`];
    }
    return [OCCASION_LABELS[key as OccasionType]];
  });
}

/**
 * Who the venue named for each occasion, a line each and every name in full:
 * "Panel with Charlotte Harrison and Tim Robey". Occasions with nobody named
 * have nothing to add to their tag, and no line.
 */
export function getOccasionDetails(
  occasions: MoviePerformanceOccasions | undefined,
): string[] {
  if (!occasions) return [];
  return TAG_ORDER.flatMap((key) => {
    const named = NAMED_DETAIL[key];
    const names = namesOf(occasions[key]);
    return named && names.length > 0 ? [named(listNames(names))] : [];
  });
}

/**
 * The bare phrases a venue bills an occasion with, which its tag says in
 * full. Only a whole phrase counts: "UK Premiere of 4K Restoration" says
 * something the tag doesn't, and stays.
 */
const BARE_PHRASES: Partial<Record<OccasionKey, RegExp>> = {
  qAndA: /^(?:live |post[- ]screening )?(?:q ?& ?a|q and a|screen ?talk)$/,
  intro: /^(?:with an? )?(?:intro|introduction)$/,
  liveScore: /^(?:with )?live (?:score|music|accompaniment)$/,
  inConversation: /^in conversation$/,
  panel: /^panel(?: discussion)?$/,
  preview: /^preview(?: screening)?$/,
};

const normalisePhrase = (text: string) =>
  text
    .toLocaleLowerCase("en-GB")
    .replace(/^[\s+&,:-]+|[\s.!:,-]+$/g, "")
    .replace(/\s+/g, " ");

/**
 * Whether a line of a performance's notes says nothing its occasion tags and
 * details don't - "+ Q&A" beside a Q&A tag. Such a line is
 * left out of the card rather than out of the data: the notes are the
 * venue's own billing, and the published data and calendar feeds have no
 * tags to stand in for it.
 *
 * A line may join several ("+ Intro + Q&A"); each part has to be covered.
 */
export function isNoteCoveredByOccasions(
  note: string,
  occasions: MoviePerformanceOccasions | undefined,
): boolean {
  if (!occasions) return false;
  const shown = [
    ...getOccasionTags(occasions),
    ...getOccasionDetails(occasions),
  ].map(normalisePhrase);
  const parts = note
    .split(/\s+[+&]\s+|^\s*\+\s*/)
    .map(normalisePhrase)
    .filter(Boolean);
  if (parts.length === 0) return false;

  return parts.every((part) => {
    if (shown.includes(part)) return true;
    return TAG_ORDER.some(
      (key) => occasions[key] && BARE_PHRASES[key]?.test(part),
    );
  });
}

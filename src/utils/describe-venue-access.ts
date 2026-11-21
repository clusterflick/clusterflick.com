import type {
  AccessFact,
  AccessSource,
  AccessStatus,
  VenueAccess,
  VenueAccessField,
} from "@/utils/get-venue-accessibility";

/**
 * How a venue access record reads on its venue page. Kept apart from the
 * component so the wording rules are tested on their own.
 */

export const VENUE_ACCESS_LABELS: Record<VenueAccessField, string> = {
  step_free_access: "Step-free access into the building",
  entrance_step_free: "Step-free main entrance",
  alt_accessible_entrance: "Separate step-free entrance",
  lift: "Lift",
  accessible_toilet: "Accessible toilet",
  changing_places: "Changing Places toilet",
  assistance_dogs: "Assistance dogs welcome",
  quiet_space: "Quiet space",
  hearing_assist_counters: "Hearing loops at counters",
};

/** The venue fields, in the order and groups the page shows them. */
export const VENUE_ACCESS_GROUPS: {
  title: string;
  fields: VenueAccessField[];
}[] = [
  {
    title: "Getting in",
    fields: [
      "step_free_access",
      "entrance_step_free",
      "alt_accessible_entrance",
      "lift",
    ],
  },
  {
    title: "Facilities",
    fields: [
      "accessible_toilet",
      "changing_places",
      "assistance_dogs",
      "quiet_space",
      "hearing_assist_counters",
    ],
  },
];

/**
 * "Unknown" is a real answer: no source we trust says either way. "Not
 * published" says that without implying the venue lacks it.
 */
const STATUS_LABELS: Record<AccessStatus, string> = {
  yes: "Yes",
  no: "No",
  partial: "Partly",
  unknown: "Not published",
  not_applicable: "Not needed",
};

export function getStatusLabel(status: AccessStatus): string {
  return STATUS_LABELS[status];
}

/**
 * A fact's status as the page says it. A fact left unknown because its sources
 * contradict each other was published, just not consistently, so it reads
 * "Unclear" rather than "Not published"; the conflict beneath it says why.
 */
export function getFactLabel(fact: AccessFact): string {
  if (fact.status === "unknown" && fact.conflict) return "Unclear";
  return getStatusLabel(fact.status);
}

/**
 * A "YYYY-MM-DD" date as "21 November 2026". The date is a calendar day, not
 * an instant, so it is read and written in UTC to stay that day everywhere.
 */
export function formatAccessDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Every fact in a record, venue fields first, then each screen's. */
function getFacts(access: VenueAccess): AccessFact[] {
  return [
    ...VENUE_ACCESS_GROUPS.flatMap(({ fields }) =>
      fields.map((field) => access[field]),
    ),
    ...access.screens.flatMap((screen) => [
      screen.step_free,
      screen.wheelchair_spaces,
      screen.space_position,
      screen.transfer_seating,
      screen.hearing_assist,
    ]),
  ];
}

export type AccessSourceNote = {
  number: number;
  url: string;
  host: string;
  /** The latest date any fact from it was checked, YYYY-MM-DD. */
  checkedOn: string;
  /** When the source says it was itself last updated, if it does. */
  sourceLastUpdated: string | null;
  tier: 1 | 2;
};

/**
 * The record's sources as numbered footnotes, numbered in the order the page
 * shows the facts citing them, one footnote per page however many facts cite
 * it. A venue's facts usually come from one or two pages, so a footnote per
 * fact would repeat the same line a dozen times.
 */
export function getSourceNotes(access: VenueAccess): {
  notes: AccessSourceNote[];
  numberOf: (url: string) => number;
} {
  const byUrl = new Map<string, AccessSourceNote>();
  const add = (source: AccessSource) => {
    const current = byUrl.get(source.url);
    if (!current) {
      byUrl.set(source.url, {
        number: byUrl.size + 1,
        url: source.url,
        host: new URL(source.url).hostname.replace(/^www\./, ""),
        checkedOn: source.checked_on,
        sourceLastUpdated: source.source_last_updated,
        tier: source.tier,
      });
      return;
    }
    if (source.checked_on > current.checkedOn) {
      current.checkedOn = source.checked_on;
    }
  };
  getFacts(access).forEach((fact) => fact.sources.forEach(add));
  return {
    notes: [...byUrl.values()],
    numberOf: (url) => {
      const note = byUrl.get(url);
      if (!note) throw new Error(`${url} isn't a source of this record`);
      return note.number;
    },
  };
}

/** The footnote numbers a fact cites, each once, in order. */
export function getFactNoteNumbers(
  fact: AccessFact,
  numberOf: (url: string) => number,
): number[] {
  return [...new Set(fact.sources.map(({ url }) => numberOf(url)))].sort(
    (a, b) => a - b,
  );
}

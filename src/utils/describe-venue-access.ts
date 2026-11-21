import type {
  AccessFact,
  AccessSource,
  AccessStatus,
  VenueAccess,
  VenueAccessField,
} from "@/utils/venue-access-types";

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

export type ScreenCount = {
  total: number;
  yes: number;
  partial: number;
  no: number;
  /** Not published, or unclear because the sources disagree. */
  unknown: number;
};

/**
 * The few facts that say at a glance whether a visit will be easy: getting
 * in, the screens, the toilet. Counted straight from the record, with no
 * judgement added: "4 of 5 screens step-free" rather than "mostly accessible".
 */
export type AccessSummary = {
  stepFreeAccess: AccessFact;
  accessibleToilet: AccessFact;
  stepFreeScreens: ScreenCount;
  screensWithSpaces: ScreenCount;
};

function countScreens(facts: AccessFact[]): ScreenCount {
  const count: ScreenCount = {
    total: facts.length,
    yes: 0,
    partial: 0,
    no: 0,
    unknown: 0,
  };
  facts.forEach(({ status }) => {
    if (status === "yes") count.yes += 1;
    else if (status === "partial") count.partial += 1;
    else if (status === "no") count.no += 1;
    else count.unknown += 1;
  });
  return count;
}

export function getAccessSummary(access: VenueAccess): AccessSummary {
  return {
    stepFreeAccess: access.step_free_access,
    accessibleToilet: access.accessible_toilet,
    stepFreeScreens: countScreens(access.screens.map((s) => s.step_free)),
    screensWithSpaces: countScreens(
      access.screens.map((s) => s.wheelchair_spaces),
    ),
  };
}

/**
 * A screen count as the summary says it: "4 of 5", with any partly or
 * unknown screens named so the figure isn't read as a full answer.
 */
export function describeScreenCount(count: ScreenCount): {
  text: string;
  detail: string | null;
} {
  const detail = [
    count.partial ? `${count.partial} partly` : null,
    count.unknown ? `${count.unknown} not known` : null,
  ]
    .filter(Boolean)
    .join(", ");
  return {
    text:
      count.yes === count.total && count.total > 0
        ? count.total === 1
          ? "Yes"
          : `All ${count.total}`
        : `${count.yes} of ${count.total}`,
    detail: detail || null,
  };
}

/**
 * Which mark a screen count gets: a tick when every screen has it, a cross
 * when none is known to, and partly otherwise.
 */
export function getScreenCountStatus(count: ScreenCount): AccessStatus {
  if (count.total === 0) return "unknown";
  if (count.yes === count.total) return "yes";
  if (count.yes === 0 && count.partial === 0) {
    return count.no > 0 ? "no" : "unknown";
  }
  return "partial";
}

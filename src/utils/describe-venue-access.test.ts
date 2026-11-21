import { describe, expect, it } from "vitest";
import {
  formatAccessDate,
  getFactNoteNumbers,
  getSourceNotes,
  getFactLabel,
  getStatusLabel,
  describeScreenCount,
  getScreenCountStatus,
  type ScreenCount,
} from "./describe-venue-access";
import {
  VENUE_ACCESS_FIELDS,
  type AccessFact,
  type AccessSource,
  type VenueAccess,
} from "./venue-access-types";

const source = (url: string, checkedOn = "2026-11-21"): AccessSource => ({
  url,
  tier: 1,
  source_last_updated: null,
  checked_on: checkedOn,
  quote: "Some words from the page",
});

const fact = (sources: AccessSource[] = []): AccessFact => ({
  status: sources.length ? "yes" : "unknown",
  note: null,
  sources,
  conflict: null,
  last_found: null,
});

const record = (overrides: Partial<VenueAccess> = {}): VenueAccess =>
  ({
    id: "example",
    access_page_url: null,
    access_contact: null,
    notes: null,
    screens: [],
    ...Object.fromEntries(VENUE_ACCESS_FIELDS.map((field) => [field, fact()])),
    ...overrides,
  }) as VenueAccess;

const A = "https://www.example.com/access";
const B = "https://example.org/guide";

describe("getStatusLabel", () => {
  it("says an unknown is not published rather than that it's missing", () => {
    expect(getStatusLabel("unknown")).toBe("Not published");
    expect(getStatusLabel("partial")).toBe("Partly");
  });
});

describe("getFactLabel", () => {
  it("says a fact left unknown by contradicting sources is unclear", () => {
    expect(
      getFactLabel({
        ...fact([source(A)]),
        status: "unknown",
        conflict: "2 or 3",
      }),
    ).toBe("Unclear");
    expect(getFactLabel(fact())).toBe("Not published");
    expect(getFactLabel(fact([source(A)]))).toBe("Yes");
  });
});

describe("formatAccessDate", () => {
  it("keeps the calendar day whatever the time zone", () => {
    expect(formatAccessDate("2026-11-21")).toBe("21 November 2026");
    expect(formatAccessDate("2026-03-29")).toBe("29 March 2026");
  });
});

describe("getSourceNotes", () => {
  it("numbers each page once, in the order the page shows its facts", () => {
    const { notes, numberOf } = getSourceNotes(
      record({
        // Facilities come after getting in, whatever the record's key order.
        accessible_toilet: fact([source(B)]),
        lift: fact([source(A)]),
        step_free_access: fact([source(A)]),
      }),
    );
    expect(notes.map(({ number, host }) => [number, host])).toEqual([
      [1, "example.com"],
      [2, "example.org"],
    ]);
    expect(numberOf(B)).toBe(2);
  });

  it("dates a page by the latest check of any fact from it", () => {
    const { notes } = getSourceNotes(
      record({
        lift: fact([source(A, "2026-10-01")]),
        accessible_toilet: fact([source(A, "2026-11-21")]),
      }),
    );
    expect(notes[0].checkedOn).toBe("2026-11-21");
  });

  it("refuses to number a page the record doesn't cite", () => {
    const { numberOf } = getSourceNotes(record());
    expect(() => numberOf(A)).toThrow(`${A} isn't a source of this record`);
  });
});

describe("getFactNoteNumbers", () => {
  it("cites each page once, however many quotes come from it", () => {
    const { numberOf } = getSourceNotes(
      record({ lift: fact([source(A), source(B), source(A)]) }),
    );
    expect(
      getFactNoteNumbers(fact([source(B), source(A), source(A)]), numberOf),
    ).toEqual([1, 2]);
  });
});

describe("screen counts", () => {
  const count = (overrides: Partial<ScreenCount>): ScreenCount => ({
    total: 5,
    yes: 0,
    partial: 0,
    no: 0,
    unknown: 0,
    ...overrides,
  });

  it("says every screen when every screen has it", () => {
    expect(describeScreenCount(count({ yes: 5 }))).toEqual({
      text: "All 5",
      detail: null,
    });
    expect(getScreenCountStatus(count({ yes: 5 }))).toBe("yes");
    expect(describeScreenCount(count({ total: 1, yes: 1 })).text).toBe("Yes");
  });

  it("names the screens it can't count as yes", () => {
    expect(
      describeScreenCount(count({ yes: 3, partial: 1, unknown: 1 })),
    ).toEqual({ text: "3 of 5", detail: "1 partly, 1 not known" });
    expect(getScreenCountStatus(count({ yes: 3, no: 2 }))).toBe("partial");
  });

  it("only crosses when a screen is known not to", () => {
    expect(getScreenCountStatus(count({ no: 2, unknown: 3 }))).toBe("no");
    expect(getScreenCountStatus(count({ unknown: 5 }))).toBe("unknown");
    expect(getScreenCountStatus(count({ total: 0 }))).toBe("unknown");
  });
});

import { describe, expect, it } from "vitest";
import {
  ALERT_LABEL_MAX_LENGTH,
  DEFAULT_ALERT_SETTINGS,
  MAX_ALERTS,
  SEARCH_QUERY_MAX_LENGTH,
  nextSearchAlertId,
  parseAlertLedger,
  parseAlertSettings,
  readAlertEmail,
  toAlertSettingsDocument,
} from "./alerts";

describe("parseAlertSettings", () => {
  it("is null when nothing was saved", () => {
    expect(parseAlertSettings(undefined)).toBeNull();
  });

  it("reads a watchlist alert, its triggers in order", () => {
    expect(
      parseAlertSettings({
        enabled: true,
        alerts: [{ type: "watchlist", notify: ["newVenue", "firstListing"] }],
      }),
    ).toEqual({
      enabled: true,
      alerts: [
        {
          type: "watchlist",
          notify: ["firstListing", "newVenue"],
          newVenueScope: "any",
        },
      ],
    });
  });

  it("reads where a new venue counts, as any for settings saved before", () => {
    const read = (newVenueScope?: unknown) =>
      parseAlertSettings({
        enabled: true,
        alerts: [{ type: "watchlist", notify: ["newVenue"], newVenueScope }],
      })?.alerts[0]?.newVenueScope;
    expect(read("favourites")).toBe("favourites");
    expect(read("any")).toBe("any");
    expect(read(undefined)).toBe("any");
    expect(read("nearby")).toBe("any");
  });

  it("drops what it can't read, and reads anything but true as off", () => {
    expect(
      parseAlertSettings({
        enabled: "yes",
        alerts: [
          { type: "venue", notify: ["newVenue"] },
          { type: "watchlist", notify: ["someday"] },
          { type: "watchlist", notify: ["newPerformance", "someday"] },
        ],
      }),
    ).toEqual({
      enabled: false,
      alerts: [
        { type: "watchlist", notify: ["newPerformance"], newVenueScope: "any" },
      ],
    });
  });

  it("keeps one alert", () => {
    const alert = { type: "watchlist", notify: ["newVenue"] };
    expect(
      parseAlertSettings({ enabled: true, alerts: [alert, alert] })?.alerts,
    ).toHaveLength(1);
  });
});

describe("search alerts", () => {
  const search = (extra: Record<string, unknown> = {}) => ({
    type: "search",
    id: "s1",
    query: "venues=rio",
    notify: ["firstListing"],
    ...extra,
  });
  const read = (...alerts: unknown[]) =>
    parseAlertSettings({ enabled: true, alerts })?.alerts;

  it("reads one beside the watchlist alert, in the reader's order", () => {
    expect(
      read(search({ label: "  Rio  " }), {
        type: "watchlist",
        notify: ["newVenue"],
      }),
    ).toEqual([
      {
        type: "search",
        id: "s1",
        query: "venues=rio",
        label: "Rio",
        notify: ["firstListing"],
        newVenueScope: "any",
      },
      { type: "watchlist", notify: ["newVenue"], newVenueScope: "any" },
    ]);
  });

  it("drops one it can't read: a bad id, no query, or too long a query", () => {
    expect(
      read(
        search({ id: "Not An Id" }),
        search({ id: "s2", query: "" }),
        search({ id: "s3", query: 42 }),
        search({ id: "s4", query: "x".repeat(SEARCH_QUERY_MAX_LENGTH + 1) }),
        search({ id: "s5", notify: [] }),
      ),
    ).toEqual([]);
  });

  it("drops a name it can't read, and keeps the search", () => {
    const [long] = read(
      search({ label: "x".repeat(ALERT_LABEL_MAX_LENGTH + 1) }),
    )!;
    const [blank] = read(search({ label: "   " }))!;
    expect(long).not.toHaveProperty("label");
    expect(blank).not.toHaveProperty("label");
  });

  it("keeps one watchlist alert and one alert per id, the first of each", () => {
    const alerts = read(
      { type: "watchlist", notify: ["newVenue"] },
      search(),
      { type: "watchlist", notify: ["firstListing"] },
      search({ query: "venues=pcc" }),
    )!;
    expect(alerts.map((alert) => alert.type)).toEqual(["watchlist", "search"]);
    expect(alerts[0].notify).toEqual(["newVenue"]);
    expect(alerts[1]).toMatchObject({ query: "venues=rio" });
  });

  it(`keeps at most ${MAX_ALERTS}`, () => {
    const many = Array.from({ length: MAX_ALERTS + 2 }, (_, n) =>
      search({ id: `s${n + 1}` }),
    );
    expect(read(...many)).toHaveLength(MAX_ALERTS);
  });

  it("round-trips through the document", () => {
    const settings = {
      enabled: true,
      alerts: [
        {
          type: "search" as const,
          id: "s1",
          query: "directors=1032",
          label: "Scorsese",
          notify: ["newVenue" as const, "firstListing" as const],
          newVenueScope: "favourites" as const,
        },
      ],
    };
    const document = toAlertSettingsDocument(settings, "reader@example.com");
    expect(document.alerts[0]).toEqual({
      type: "search",
      id: "s1",
      query: "directors=1032",
      label: "Scorsese",
      notify: ["firstListing", "newVenue"],
      newVenueScope: "favourites",
    });
    expect(parseAlertSettings(document)).toEqual({
      ...settings,
      alerts: [{ ...settings.alerts[0], notify: ["firstListing", "newVenue"] }],
    });
  });

  it("writes no name when it's empty", () => {
    const document = toAlertSettingsDocument(
      {
        enabled: true,
        alerts: [
          {
            type: "search",
            id: "s1",
            query: "venues=rio",
            label: " ",
            notify: ["firstListing"],
            newVenueScope: "any",
          },
        ],
      },
      "reader@example.com",
    );
    expect(document.alerts[0]).not.toHaveProperty("label");
  });
});

describe("nextSearchAlertId", () => {
  it("is the first unused s-number", () => {
    const alert = (id: string) => ({
      type: "search" as const,
      id,
      query: "venues=rio",
      notify: ["firstListing" as const],
      newVenueScope: "any" as const,
    });
    expect(nextSearchAlertId([])).toBe("s1");
    expect(nextSearchAlertId([alert("s1"), alert("s3")])).toBe("s2");
    expect(nextSearchAlertId(DEFAULT_ALERT_SETTINGS.alerts)).toBe("s1");
  });
});

describe("toAlertSettingsDocument", () => {
  it("writes the triggers once each, in order, with the address and scope", () => {
    expect(
      toAlertSettingsDocument(
        {
          enabled: true,
          alerts: [
            {
              type: "watchlist",
              notify: ["newVenue", "firstListing", "newVenue"],
              newVenueScope: "favourites",
            },
          ],
        },
        "reader@example.com",
      ),
    ).toEqual({
      enabled: true,
      email: "reader@example.com",
      alerts: [
        {
          type: "watchlist",
          notify: ["firstListing", "newVenue"],
          newVenueScope: "favourites",
        },
      ],
    });
  });

  it("round-trips the defaults and the address", () => {
    const document = toAlertSettingsDocument(
      DEFAULT_ALERT_SETTINGS,
      "reader@example.com",
    );
    expect(parseAlertSettings(document)).toEqual(DEFAULT_ALERT_SETTINGS);
    expect(readAlertEmail(document)).toBe("reader@example.com");
  });

  it("has no address for settings saved without one", () => {
    expect(readAlertEmail({ enabled: true, alerts: [] })).toBeNull();
  });
});

describe("parseAlertLedger", () => {
  it("has no runs before the first", () => {
    expect(parseAlertLedger(undefined)).toEqual({ runs: [] });
  });

  it("reads the runs newest first, and why alerts were stopped", () => {
    expect(
      parseAlertLedger({
        runs: [
          { on: "2026-11-15", at: 1, outcome: "nothingNew" },
          { on: "2026-11-16", at: 2, outcome: "sent", films: 3 },
          { on: "2026-11-17", at: 3, outcome: "failed", reason: "x" },
        ],
        stopped: { reason: "unsubscribed", at: 4, emailOn: "2026-11-16" },
        sent: { "film:1": 2 },
      }),
    ).toEqual({
      runs: [
        { on: "2026-11-17", at: 3, outcome: "failed", reason: "x" },
        { on: "2026-11-16", at: 2, outcome: "sent", films: 3 },
        { on: "2026-11-15", at: 1, outcome: "nothingNew" },
      ],
      stopped: { reason: "unsubscribed", at: 4, emailOn: "2026-11-16" },
    });
  });

  it("drops runs and stops it can't read", () => {
    expect(
      parseAlertLedger({
        runs: [
          { on: "16 Nov", at: 1, outcome: "sent" },
          { on: "2026-11-16", at: 1, outcome: "exploded" },
          { on: "2026-11-16", outcome: "sent" },
        ],
        stopped: { reason: "bored", at: 1 },
      }),
    ).toEqual({ runs: [] });
  });
});

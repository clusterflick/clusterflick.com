import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALERT_SETTINGS,
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

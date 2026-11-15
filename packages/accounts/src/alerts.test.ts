import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALERT_SETTINGS,
  parseAlertLedger,
  parseAlertSettings,
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
      alerts: [{ type: "watchlist", notify: ["firstListing", "newVenue"] }],
    });
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
      alerts: [{ type: "watchlist", notify: ["newPerformance"] }],
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
  it("writes the triggers once each, in order", () => {
    expect(
      toAlertSettingsDocument({
        enabled: true,
        alerts: [
          {
            type: "watchlist",
            notify: ["newVenue", "firstListing", "newVenue"],
          },
        ],
      }),
    ).toEqual({
      enabled: true,
      alerts: [{ type: "watchlist", notify: ["firstListing", "newVenue"] }],
    });
  });

  it("round-trips the defaults", () => {
    expect(
      parseAlertSettings(toAlertSettingsDocument(DEFAULT_ALERT_SETTINGS)),
    ).toEqual(DEFAULT_ALERT_SETTINGS);
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

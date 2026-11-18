import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAPABILITY_IDS,
  CapabilityId,
  hasCapability,
  isGranted,
  RememberedCapability,
} from "./capabilities";
import { Firestore } from "./firestore";
import { UpstreamError } from "./google-auth";

const db = new Firestore("p", async () => "access-token");

/** Firestore holding `users/{uid}/meta/capabilities` as `fields`, or none. */
function serveCapabilities(fields?: Record<string, unknown>) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () =>
      fields === undefined
        ? new Response("", { status: 404 })
        : Response.json({ name: "x", fields }),
    );
}

afterEach(() => {
  vi.restoreAllMocks();
});

const GRANT = { mapValue: { fields: { grantedAt: { integerValue: "1" } } } };

describe("capability ids", () => {
  it("lists every one", () => {
    expect([...CAPABILITY_IDS].sort()).toEqual([
      "assistantAccess",
      "emailAlerts",
      "letterboxdSync",
      "publicProfile",
    ]);
    expect(CapabilityId.AssistantAccess).toBe("assistantAccess");
  });
});

describe("isGranted", () => {
  it("is the key being there, whatever it holds", () => {
    expect(isGranted({ publicProfile: null }, "publicProfile")).toBe(true);
    expect(isGranted({ emailAlerts: {} }, "publicProfile")).toBe(false);
    expect(isGranted(null, "publicProfile")).toBe(false);
  });
});

describe("hasCapability", () => {
  it("reads the reader's capabilities", async () => {
    const fetch = serveCapabilities({ assistantAccess: GRANT });
    expect(await hasCapability(db, "u1", "assistantAccess")).toBe(true);
    expect(await hasCapability(db, "u1", "emailAlerts")).toBe(false);
    expect(String(fetch.mock.calls[0][0])).toMatch(
      /\/users\/u1\/meta\/capabilities$/,
    );
  });

  it("grants nothing without a document", async () => {
    serveCapabilities();
    expect(await hasCapability(db, "u1", "assistantAccess")).toBe(false);
  });

  it("puts nothing but a uid in the path", async () => {
    const fetch = serveCapabilities({});
    await expect(
      hasCapability(db, "../handles/x", "assistantAccess"),
    ).rejects.toThrow(UpstreamError);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("RememberedCapability", () => {
  it("remembers an answer for its time, then asks again", async () => {
    const fetch = serveCapabilities({ assistantAccess: GRANT });
    const check = new RememberedCapability("assistantAccess", 60_000);
    expect(await check.has(db, "u1", { now: 0 })).toBe(true);
    expect(await check.has(db, "u1", { now: 59_999 })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await check.has(db, "u1", { now: 60_000 })).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("asks afresh when told to, or once cleared", async () => {
    const fetch = serveCapabilities({});
    const check = new RememberedCapability("assistantAccess", 60_000);
    expect(await check.has(db, "u1", { now: 0 })).toBe(false);
    vi.restoreAllMocks();
    serveCapabilities({ assistantAccess: GRANT });
    expect(await check.has(db, "u1", { now: 1 })).toBe(false);
    expect(await check.has(db, "u1", { now: 2, fresh: true })).toBe(true);
    check.clear();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("keeps each reader's answer apart", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      String(url).includes("/users/u1/")
        ? Response.json({ name: "x", fields: { assistantAccess: GRANT } })
        : new Response("", { status: 404 }),
    );
    const check = new RememberedCapability("assistantAccess", 60_000);
    expect(await check.has(db, "u1")).toBe(true);
    expect(await check.has(db, "u2")).toBe(false);
  });
});

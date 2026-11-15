import { afterEach, describe, expect, it, vi } from "vitest";
import {
  decodeFields,
  decodeValue,
  encodeFields,
  encodeValue,
  Firestore,
  isUid,
  PreconditionError,
} from "./firestore";
import { UpstreamError } from "./google-auth";

const ROOT = "projects/p/databases/(default)/documents";
const db = new Firestore("p", async () => "access-token");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("decodeValue", () => {
  it.each([
    [{ stringValue: "a" }, "a"],
    [{ booleanValue: true }, true],
    [{ integerValue: "42" }, 42],
    [{ doubleValue: 1.5 }, 1.5],
    [{ nullValue: null }, null],
    [{ timestampValue: "2026-11-15T00:00:00Z" }, "2026-11-15T00:00:00Z"],
    [{ arrayValue: {} }, []],
    [{ mapValue: {} }, {}],
    [{ referenceValue: "x" }, undefined],
  ])("reads %o", (value, expected) => {
    expect(decodeValue(value)).toEqual(expected);
  });

  it("reads maps and arrays all the way down", () => {
    expect(
      decodeFields({
        seen: {
          mapValue: {
            fields: {
              m1: {
                mapValue: {
                  fields: {
                    title: { stringValue: "Halloween" },
                    genres: {
                      arrayValue: { values: [{ stringValue: "horror" }] },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ).toEqual({ seen: { m1: { title: "Halloween", genres: ["horror"] } } });
  });
});

describe("Firestore", () => {
  it("gets a document with the service account's token", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        name: `${ROOT}/users/u1`,
        fields: { handle: { stringValue: "ali" } },
      }),
    );
    expect(await db.get("users/u1")).toEqual({ handle: "ali" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`https://firestore.googleapis.com/v1/${ROOT}/users/u1`);
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("reads a missing document as null, and fails loudly on anything else", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 404 }),
    );
    expect(await db.get("users/u1")).toBeNull();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", { status: 503 }),
    );
    await expect(db.get("users/u1")).rejects.toThrow(UpstreamError);
  });

  it("batch-gets in the order asked, whatever order Firestore answers in", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([
        { missing: `${ROOT}/users/u2` },
        {
          found: {
            name: `${ROOT}/users/u1`,
            fields: { seen: { mapValue: {} } },
          },
        },
        { found: { name: `${ROOT}/users/u3` } },
      ]),
    );
    expect(
      await db.batchGet(["users/u1", "users/u2", "users/u3"], ["seen"]),
    ).toEqual([{ seen: { mapValue: {} } }, null, {}]);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`https://firestore.googleapis.com/v1/${ROOT}:batchGet`);
    expect(JSON.parse(String(init?.body))).toEqual({
      documents: [`${ROOT}/users/u1`, `${ROOT}/users/u2`, `${ROOT}/users/u3`],
      mask: { fieldPaths: ["seen"] },
    });
  });

  it("fails loudly when a batch leaves a document out", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));
    await expect(db.batchGet(["users/u1"], ["seen"])).rejects.toThrow(
      "left out",
    );
  });
});

describe("isUid", () => {
  it("takes what Firebase makes", () => {
    expect(isUid("aB3xY9")).toBe(true);
  });

  it.each(["", "a/b", "../x", "a".repeat(129), 7, undefined])(
    "refuses %o",
    (value) => {
      expect(isUid(value)).toBe(false);
    },
  );
});

describe("encodeValue", () => {
  it("writes what decodeValue reads", () => {
    const data = {
      title: "Halloween",
      seen: true,
      at: 1_794_700_000_000,
      rating: 4.5,
      none: null,
      runs: [{ on: "2026-11-16", films: 2 }],
      empty: {},
    };
    expect(decodeFields(encodeFields(data))).toEqual(data);
    expect(encodeValue(3)).toEqual({ integerValue: "3" });
  });

  it.each([undefined, NaN, () => {}])("refuses %o", (value) => {
    expect(() => encodeValue(value)).toThrow(TypeError);
  });
});

/** The body a call to Firestore was sent. */
const sent = (fetch: { mock: { calls: unknown[][] } }, call = 0) =>
  JSON.parse(String((fetch.mock.calls[call][1] as RequestInit).body));

describe("Firestore writes", () => {
  it("reads a document with the time it was written", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        name: `${ROOT}/users/u1/meta/alert-ledger`,
        fields: { runs: { arrayValue: {} } },
        updateTime: "2026-11-16T20:00:00.123456Z",
      }),
    );
    expect(await db.getVersioned("users/u1/meta/alert-ledger")).toEqual({
      data: { runs: [] },
      updateTime: "2026-11-16T20:00:00.123456Z",
    });
  });

  it("commits sets, updates and deletes together, with preconditions", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ writeResults: [] }));
    await db.commit([
      {
        set: "users/u1/meta/alert-ledger",
        data: { sending: "2026-11-16" },
        precondition: { updateTime: "t1" },
      },
      {
        update: "users/u1/meta/alerts",
        data: { enabled: false },
        fields: ["enabled", "gone"],
        precondition: { exists: true },
      },
      { delete: "users/u2/meta/alerts" },
    ]);
    expect(fetch.mock.calls[0][0]).toBe(
      `https://firestore.googleapis.com/v1/${ROOT}:commit`,
    );
    expect(sent(fetch)).toEqual({
      writes: [
        {
          update: {
            name: `${ROOT}/users/u1/meta/alert-ledger`,
            fields: { sending: { stringValue: "2026-11-16" } },
          },
          currentDocument: { updateTime: "t1" },
        },
        {
          update: {
            name: `${ROOT}/users/u1/meta/alerts`,
            fields: { enabled: { booleanValue: false } },
          },
          updateMask: { fieldPaths: ["enabled", "gone"] },
          currentDocument: { exists: true },
        },
        { delete: `${ROOT}/users/u2/meta/alerts` },
      ],
    });
  });

  it("says when a precondition failed, so the caller can read again", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: { code: 400, status: "FAILED_PRECONDITION" } },
        { status: 400 },
      ),
    );
    await expect(
      db.commit([{ delete: "users/u1/meta/alerts" }]),
    ).rejects.toThrow(PreconditionError);
  });

  it("fails loudly on anything else", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: { code: 403, status: "PERMISSION_DENIED" } },
        { status: 403 },
      ),
    );
    const failure = db.commit([{ delete: "users/u1/meta/alerts" }]);
    await expect(failure).rejects.toThrow(UpstreamError);
    await expect(failure).rejects.not.toThrow(PreconditionError);
  });

  it("backquotes a field name that isn't plain", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({}));
    await db.commit([
      { update: "x/y", data: {}, fields: ["alert-ledger", "a`b"] },
    ]);
    expect(sent(fetch).writes[0].updateMask.fieldPaths).toEqual([
      "`alert-ledger`",
      "`a\\`b`",
    ]);
  });
});

describe("Firestore collection-group queries", () => {
  it("finds the documents a field matches, at any depth, with their paths", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([
        {
          document: {
            name: `${ROOT}/users/u1/meta/alerts`,
            fields: { enabled: { booleanValue: true } },
          },
          readTime: "t",
        },
      ]),
    );
    expect(await db.findInCollectionGroup("meta", "enabled", true)).toEqual([
      { path: "users/u1/meta/alerts", data: { enabled: true } },
    ]);
    expect(fetch.mock.calls[0][0]).toBe(
      `https://firestore.googleapis.com/v1/${ROOT}:runQuery`,
    );
    expect(sent(fetch)).toEqual({
      structuredQuery: {
        from: [{ collectionId: "meta", allDescendants: true }],
        where: {
          fieldFilter: {
            field: { fieldPath: "enabled" },
            op: "EQUAL",
            value: { booleanValue: true },
          },
        },
      },
    });
  });

  it("finds none when Firestore sends only a read time", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([{ readTime: "t" }]),
    );
    expect(await db.findInCollectionGroup("meta", "enabled", true)).toEqual([]);
  });
});

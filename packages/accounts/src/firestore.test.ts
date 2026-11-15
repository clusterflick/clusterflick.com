import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeFields, decodeValue, Firestore, isUid } from "./firestore";
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

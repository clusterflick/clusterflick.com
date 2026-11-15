import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import type { Firestore } from "firebase/firestore/lite";
import { commitUserWrite, PROFILE_PURGE_PATH } from "./commit-user-write";

const batch = vi.hoisted(() => ({
  set: vi.fn(),
  commit: vi.fn(),
}));
vi.mock("firebase/firestore/lite", () => ({ writeBatch: () => batch }));

const currentUser = vi.hoisted(() => ({
  value: { getIdToken: async () => "id-token" } as {
    getIdToken: () => Promise<string>;
  } | null,
}));
vi.mock(".", () => ({
  loadFirebase: async () => ({ auth: { currentUser: currentUser.value } }),
}));

const db = {} as Firestore;
const noWait = async () => {};
let fetchSpy: MockInstance<typeof fetch>;

beforeEach(() => {
  batch.set.mockReset();
  batch.commit.mockReset().mockResolvedValue(undefined);
  currentUser.value = { getIdToken: async () => "id-token" };
  fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("commitUserWrite", () => {
  test("commits the batch, then purges the reader's profile", async () => {
    const order: string[] = [];
    batch.commit.mockImplementation(async () => order.push("commit"));
    fetchSpy.mockImplementation(async () => {
      order.push("purge");
      return new Response(null, { status: 204 });
    });

    const result = await commitUserWrite(db, (b) => {
      b.set("ref" as never, {});
    });

    expect(batch.set).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["commit", "purge"]);
    expect(result).toEqual({ purged: true });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(PROFILE_PURGE_PATH);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer id-token",
    );
    expect(JSON.parse(String(init?.body))).toEqual({});
  });

  test("names the handles a profile save gives up and takes, once each", async () => {
    await commitUserWrite(db, () => {}, {
      purgeHandles: ["old-name", "new-name", "new-name"],
    });
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      handles: ["old-name", "new-name"],
    });
  });

  test("a failed commit throws, and purges nothing", async () => {
    batch.commit.mockRejectedValue(new Error("permission-denied"));
    await expect(commitUserWrite(db, () => {})).rejects.toThrow(
      "permission-denied",
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("retries a failed purge twice, then says it wasn't purged", async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 503 }));
    const sleep = vi.fn(async (ms: number) => void ms);
    const result = await commitUserWrite(db, () => {}, { sleep });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([500, 2000]);
    expect(result).toEqual({ purged: false });
  });

  test("a purge that succeeds on a retry is purged", async () => {
    fetchSpy
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const result = await commitUserWrite(db, () => {}, { sleep: noWait });
    expect(result).toEqual({ purged: true });
  });

  test("with nobody signed in there's nothing to purge", async () => {
    currentUser.value = null;
    const result = await commitUserWrite(db, () => {});
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ purged: false });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchTmdb, TmdbSearchError } from "./index";

const RESPONSE = {
  page: 1,
  totalPages: 1,
  totalResults: 1,
  results: [{ id: "438631", title: "Dune", year: "2021" }],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const reply = (status: number, body: unknown = {}) =>
  Response.json(body, { status });

describe("searchTmdb", () => {
  it("sends the trimmed query with the reader's token", async () => {
    fetchMock.mockResolvedValue(reply(200, RESPONSE));
    const getIdToken = vi.fn(async () => "token-1");

    await expect(searchTmdb("  dune part two ", getIdToken)).resolves.toEqual(
      RESPONSE,
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/tmdb/search?q=dune+part+two");
    expect(init.headers).toEqual({ Authorization: "Bearer token-1" });
    expect(getIdToken).toHaveBeenCalledWith(false);
  });

  it("refreshes the token and retries once on a 401", async () => {
    fetchMock
      .mockResolvedValueOnce(reply(401))
      .mockResolvedValueOnce(reply(200, RESPONSE));
    const getIdToken = vi.fn(async (force?: boolean) =>
      force ? "fresh" : "stale",
    );

    await expect(searchTmdb("dune", getIdToken)).resolves.toEqual(RESPONSE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers).toEqual({
      Authorization: "Bearer fresh",
    });
  });

  it("gives up after a second 401", async () => {
    fetchMock.mockResolvedValue(reply(401));
    await expect(searchTmdb("dune", async () => "t")).rejects.toMatchObject({
      reason: "unavailable",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry a 429", async () => {
    fetchMock.mockResolvedValue(reply(429));
    const error = await searchTmdb("dune", async () => "t").catch((e) => e);
    expect(error).toBeInstanceOf(TmdbSearchError);
    expect(error.reason).toBe("rate-limited");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 403, 404, 502])(
    "reports a %s as unavailable",
    async (status) => {
      fetchMock.mockResolvedValue(reply(status));
      await expect(searchTmdb("dune", async () => "t")).rejects.toMatchObject({
        reason: "unavailable",
      });
    },
  );
});

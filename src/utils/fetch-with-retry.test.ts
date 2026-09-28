import { describe, expect, it, vi } from "vitest";
import {
  fetchWithRetry,
  FetchRetryError,
  MAX_ATTEMPTS,
} from "./fetch-with-retry";

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });
const status = (code: number) =>
  new Response("", { status: code, statusText: `Status ${code}` });
const json = (response: Response) => response.json();

function setup(...outcomes: Array<Response | Error>) {
  const fetchImpl = vi.fn(async () => {
    const next = outcomes.shift();
    if (!next) throw new Error("Unexpected extra fetch");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
  return { fetchImpl, sleep };
}

describe("fetchWithRetry", () => {
  it("returns the body on the first success without sleeping", async () => {
    const { fetchImpl, sleep } = setup(ok({ a: 1 }));
    await expect(
      fetchWithRetry("/x", json, { fetchImpl, sleep }),
    ).resolves.toEqual({ a: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries network errors and recovers", async () => {
    const { fetchImpl, sleep } = setup(
      new TypeError("Failed to fetch"),
      new TypeError("Failed to fetch"),
      ok("done"),
    );
    await expect(
      fetchWithRetry("/x", json, { fetchImpl, sleep }),
    ).resolves.toBe("done");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("retries 5xx, 408 and 429", async () => {
    const { fetchImpl, sleep } = setup(
      status(503),
      status(429),
      status(408),
      ok(1),
    );
    await expect(
      fetchWithRetry("/x", json, { fetchImpl, sleep }),
    ).resolves.toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("does not retry a permanent 4xx", async () => {
    const { fetchImpl, sleep } = setup(status(404));
    const error = await fetchWithRetry("/x", json, { fetchImpl, sleep }).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(FetchRetryError);
    expect(error.status).toBe(404);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("retries a body that fails to parse, as a truncated response would", async () => {
    const { fetchImpl, sleep } = setup(
      new Response('{"trunc', { status: 200 }),
      ok("whole"),
    );
    await expect(
      fetchWithRetry("/x", json, { fetchImpl, sleep }),
    ).resolves.toBe("whole");
  });

  it("gives up after every attempt with the last error", async () => {
    const { fetchImpl, sleep } = setup(
      ...Array.from({ length: MAX_ATTEMPTS }, () => status(502)),
    );
    const error = await fetchWithRetry("/x", json, { fetchImpl, sleep }).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(FetchRetryError);
    expect(error.status).toBe(502);
    expect(error.attempts).toBe(MAX_ATTEMPTS);
    expect(fetchImpl).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(sleep).toHaveBeenCalledTimes(MAX_ATTEMPTS - 1);
  });

  it("backs off exponentially with jitter", async () => {
    const { fetchImpl, sleep } = setup(
      ...Array.from({ length: MAX_ATTEMPTS }, () => status(500)),
    );
    await fetchWithRetry("/x", json, { fetchImpl, sleep }).catch(() => {});
    const delays = sleep.mock.calls.map(([ms]) => ms);
    delays.forEach((ms, i) => {
      const base = 500 * 2 ** i;
      expect(ms).toBeGreaterThanOrEqual(base);
      expect(ms).toBeLessThan(base + 500);
    });
  });
});

import {
  decodeJwt,
  decodeProtectedHeader,
  exportPKCS8,
  generateKeyPair,
} from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAccessToken, getAccessToken, UpstreamError } from "./google-auth";

const { privateKey } = await generateKeyPair("RS256", { extractable: true });
const KEY = {
  client_email: "worker@clusterflick-test.iam.gserviceaccount.com",
  private_key: await exportPKCS8(privateKey),
  private_key_id: "key1",
};
const SECRET = JSON.stringify(KEY);

let exchanges: string[] = [];

/** Google's token endpoint, handing out `token<n>` for `expiresIn` seconds. */
function serveTokens({ expiresIn = 3600, status = 200 } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (_, init) => {
    const assertion = new URLSearchParams(String(init?.body)).get("assertion");
    exchanges.push(assertion!);
    if (status !== 200) return new Response("nope", { status });
    return Response.json({
      access_token: `token${exchanges.length}`,
      expires_in: expiresIn,
    });
  });
}

beforeEach(() => {
  clearAccessToken();
  exchanges = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("getAccessToken", () => {
  it("exchanges a JWT signed with the service account's key", async () => {
    const fetch = serveTokens();
    expect(await getAccessToken(SECRET)).toBe("token1");
    expect(fetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" }),
    );
    const [assertion] = exchanges;
    expect(decodeProtectedHeader(assertion)).toMatchObject({
      alg: "RS256",
      kid: "key1",
    });
    expect(decodeJwt(assertion)).toMatchObject({
      iss: KEY.client_email,
      aud: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/datastore",
    });
  });

  it("reuses a token, and shares one exchange among requests together", async () => {
    serveTokens();
    const together = await Promise.all([
      getAccessToken(SECRET),
      getAccessToken(SECRET),
    ]);
    expect(together).toEqual(["token1", "token1"]);
    expect(await getAccessToken(SECRET)).toBe("token1");
    expect(exchanges).toHaveLength(1);
  });

  it("replaces a token five minutes before it expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    serveTokens({ expiresIn: 3600 });
    expect(await getAccessToken(SECRET)).toBe("token1");
    vi.advanceTimersByTime(54 * 60_000);
    expect(await getAccessToken(SECRET)).toBe("token1");
    vi.advanceTimersByTime(2 * 60_000);
    expect(await getAccessToken(SECRET)).toBe("token2");
  });

  it("doesn't serve a rotated key the old key's token", async () => {
    serveTokens();
    await getAccessToken(SECRET);
    const rotated = JSON.stringify({ ...KEY, private_key_id: "key2" });
    expect(await getAccessToken(rotated)).toBe("token2");
  });

  it("fails loudly, and tries again on the next request", async () => {
    serveTokens({ status: 500 });
    await expect(getAccessToken(SECRET)).rejects.toThrow(UpstreamError);
    vi.restoreAllMocks();
    serveTokens();
    expect(await getAccessToken(SECRET)).toBe("token2");
  });

  it.each([
    ["isn't JSON", "{"],
    ["has no key", JSON.stringify({ client_email: KEY.client_email })],
  ])("refuses a secret that %s", async (_, secret) => {
    await expect(getAccessToken(secret)).rejects.toThrow(UpstreamError);
  });

  it("refuses an answer with no token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({}));
    await expect(getAccessToken(SECRET)).rejects.toThrow("no token");
  });
});

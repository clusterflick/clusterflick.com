import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PURGE_URL,
  getPurgeConfig,
  purgeProfile,
} from "./purge-profile";

describe("getPurgeConfig", () => {
  it("needs the secret", () => {
    expect(() => getPurgeConfig({})).toThrow("PROFILES_PURGE_SECRET");
  });

  it("goes to the live site unless told otherwise", () => {
    expect(getPurgeConfig({ PROFILES_PURGE_SECRET: "s" })).toEqual({
      secret: "s",
      url: DEFAULT_PURGE_URL,
    });
    expect(
      getPurgeConfig({
        PROFILES_PURGE_SECRET: "s",
        PROFILES_PURGE_URL: "http://localhost:8788/api/profiles/purge",
      }).url,
    ).toBe("http://localhost:8788/api/profiles/purge");
  });
});

describe("purgeProfile", () => {
  const config = { secret: "s3cret", url: DEFAULT_PURGE_URL };

  it("names the reader, with the secret", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    await purgeProfile("uid1", config, fetch);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(DEFAULT_PURGE_URL);
    expect(init.headers.Authorization).toBe("Bearer s3cret");
    expect(JSON.parse(init.body)).toEqual({ uid: "uid1" });
  });

  it("throws when the Worker refuses", async () => {
    const fetch = vi.fn(async () => new Response("no", { status: 401 }));
    await expect(purgeProfile("uid1", config, fetch)).rejects.toThrow(
      "Couldn't purge uid1's cached profile: 401",
    );
  });
});

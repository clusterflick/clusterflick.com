import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeScopes,
  disconnectAssistant,
  getConnectCallbackUrl,
  listConnections,
  MCP_URL,
  parseConnectState,
} from ".";

afterEach(() => {
  vi.restoreAllMocks();
});

const STATE = "a".repeat(40) + "-_9";

describe("parseConnectState", () => {
  it("reads the state the Worker hands out", () => {
    expect(parseConnectState(`?state=${STATE}`)).toBe(STATE);
  });

  it.each([
    ["none", ""],
    ["too short", `?state=${STATE.slice(1)}`],
    ["too long", `?state=${STATE}a`],
    ["another address", "?state=https://example.com/steal"],
    ["a query of its own", `?state=${STATE.slice(0, 40)}%26x%3D`],
  ])("refuses %s", (_, search) => {
    expect(parseConnectState(search)).toBeNull();
  });
});

describe("the Worker's addresses", () => {
  it("are on its own host", () => {
    expect(MCP_URL).toBe("https://mcp.clusterflick.com/mcp");
    expect(getConnectCallbackUrl(STATE)).toBe(
      `https://mcp.clusterflick.com/callback?state=${STATE}`,
    );
  });
});

describe("connected assistants", () => {
  const connection = {
    id: "grant1",
    name: "Claude",
    domain: "claude.ai",
    connectedAt: 1_794_700_000_000,
    scopes: ["listings", "lists"],
  };

  it("are listed from the Worker, with the reader's sign-in", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ connections: [connection] }));
    expect(await listConnections("id-token")).toEqual([connection]);
    expect(fetch).toHaveBeenCalledWith(
      "https://mcp.clusterflick.com/connections",
      { headers: { Authorization: "Bearer id-token" } },
    );
  });

  it("are disconnected one at a time", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    await disconnectAssistant("id-token", "grant1");
    expect(fetch).toHaveBeenCalledWith(
      "https://mcp.clusterflick.com/connections/grant1",
      { method: "DELETE", headers: { Authorization: "Bearer id-token" } },
    );
  });

  it("fail loudly when the Worker refuses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );
    await expect(listConnections("id-token")).rejects.toThrow("503");
    await expect(disconnectAssistant("id-token", "grant1")).rejects.toThrow(
      "503",
    );
  });
});

describe("describeScopes", () => {
  it("says what a connection can do, and what it can't", () => {
    expect(describeScopes(["listings", "lists", "offline_access"])).toEqual({
      can: [
        "Searches the listings",
        "Sees your watchlist, Seen list and venues",
      ],
      cannot: [],
    });
    expect(describeScopes(["listings"])).toEqual({
      can: ["Searches the listings"],
      cannot: ["Can't see your watchlist, Seen list or venues"],
    });
  });
});

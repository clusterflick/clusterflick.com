import { describe, expect, it } from "vitest";
import { getConnectCallbackUrl, MCP_URL, parseConnectState } from ".";

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

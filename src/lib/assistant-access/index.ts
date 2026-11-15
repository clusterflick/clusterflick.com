/**
 * Where a reader's AI assistant connects to search the listings: api-mcp, a
 * Worker on a host of its own, so its OAuth addresses (`/.well-known/…`)
 * stay clear of the site's. `NEXT_PUBLIC_MCP_ORIGIN` points a local build at
 * `wrangler dev`.
 */
export const MCP_ORIGIN =
  process.env.NEXT_PUBLIC_MCP_ORIGIN || "https://mcp.clusterflick.com";

/** The address a reader adds to their assistant. */
export const MCP_URL = `${MCP_ORIGIN}/mcp`;

/**
 * The sign-in the Worker sent the reader here to finish, from /connect/'s
 * `state`: what the OAuth library hands out (32 random bytes, base64url), or
 * null for anything else. Checked so a crafted link can't put anything else
 * into the address the reader's sign-in is posted to.
 */
export function parseConnectState(search: string): string | null {
  const state = new URLSearchParams(search).get("state");
  return state && /^[A-Za-z0-9_-]{43}$/.test(state) ? state : null;
}

/**
 * Where /connect/ posts the reader's sign-in: always the Worker, never an
 * address taken from the link, so a link can't send it anywhere else.
 */
export function getConnectCallbackUrl(state: string): string {
  return `${MCP_ORIGIN}/callback?state=${encodeURIComponent(state)}`;
}

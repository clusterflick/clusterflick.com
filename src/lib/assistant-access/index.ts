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

/** An assistant the reader has connected, as api-mcp describes it. */
export type Connection = {
  id: string;
  /** What the assistant calls itself. */
  name: string;
  /** For one that publishes its details: the domain it publishes them on. */
  domain?: string;
  /** Epoch milliseconds. */
  connectedAt: number;
};

const CONNECTIONS_URL = `${MCP_ORIGIN}/connections`;

/** The reader's connected assistants, newest first. */
export async function listConnections(idToken: string): Promise<Connection[]> {
  const response = await fetch(CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    throw new Error(`Listing connections failed: ${response.status}`);
  }
  return ((await response.json()) as { connections: Connection[] }).connections;
}

/**
 * Disconnects one assistant: its access ends at once, and it would have to
 * be signed in again.
 */
export async function disconnectAssistant(
  idToken: string,
  id: string,
): Promise<void> {
  const response = await fetch(`${CONNECTIONS_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) {
    throw new Error(`Disconnecting failed: ${response.status}`);
  }
}

/**
 * An access token for Firestore, from a Worker's service account, as the Admin
 * SDK gets one: a JWT signed with the account's key, exchanged at Google's
 * token endpoint. Each Worker has a service account of its own, holding only
 * the roles it needs.
 */
import { importPKCS8, SignJWT } from "jose";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/datastore";
/** Replaced this long before Google says it expires, so none is sent stale. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export class UpstreamError extends Error {}

type ServiceAccount = {
  client_email: string;
  private_key: string;
  private_key_id?: string;
};

function parseServiceAccount(json: string): ServiceAccount {
  let key;
  try {
    key = JSON.parse(json);
  } catch {
    throw new UpstreamError("FIREBASE_SERVICE_ACCOUNT isn't JSON");
  }
  if (
    typeof key?.client_email !== "string" ||
    typeof key?.private_key !== "string"
  ) {
    throw new UpstreamError(
      "FIREBASE_SERVICE_ACCOUNT has no client_email or private_key",
    );
  }
  return key;
}

/**
 * At module scope, so an isolate reuses one token across requests. The promise
 * is kept rather than the token, so requests that arrive together share one
 * exchange. Keyed on the secret, so a rotated key isn't served the old token.
 */
let cached:
  | { secret: string; token: Promise<{ value: string; expiresAt: number }> }
  | undefined;

/** For tests, which each start with no token. */
export function clearAccessToken() {
  cached = undefined;
}

/**
 * An OAuth access token for Firestore, from the service account's key: a JWT
 * signed with it, exchanged at Google's token endpoint, as the Admin SDK does.
 */
export async function getAccessToken(secret: string): Promise<string> {
  if (cached?.secret === secret) {
    const token = await cached.token.catch(() => undefined);
    if (token && token.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
      return token.value;
    }
  }
  const token = exchange(parseServiceAccount(secret));
  cached = { secret, token };
  try {
    return (await token).value;
  } catch (e) {
    // A failure isn't kept: the next request tries again.
    if (cached?.token === token) cached = undefined;
    throw e;
  }
}

async function exchange(key: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
      ...(key.private_key_id && { kid: key.private_key_id }),
    })
    .setIssuer(key.client_email)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPKCS8(key.private_key, "RS256"));

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new UpstreamError(
      `Token exchange failed: ${response.status} ${await response.text()}`,
    );
  }
  const body = (await response.json()) as {
    access_token?: unknown;
    expires_in?: unknown;
  };
  if (
    typeof body.access_token !== "string" ||
    typeof body.expires_in !== "number"
  ) {
    throw new UpstreamError("Token exchange returned no token");
  }
  return {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}

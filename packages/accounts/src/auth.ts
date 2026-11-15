/**
 * Firebase ID token checks, as the site's sign-in makes them: what a Worker
 * needs to know which reader is calling, from the token the site's pages send.
 */
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

/**
 * Google's signing keys for Firebase ID tokens. At module scope so the fetched
 * key set is reused across requests in the same isolate.
 */
export const FIREBASE_JWKS: JWTVerifyGetKey = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
  }
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1];
}

/**
 * Verifies a Firebase ID token as the Admin SDK would, and returns the user's
 * uid. The site signs in by email link only, which verifies the address, so
 * an unverified account didn't come from the site.
 */
export async function verifyFirebaseToken(
  token: string,
  projectId: string,
  keys: JWTVerifyGetKey = FIREBASE_JWKS,
): Promise<string> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, keys, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      requiredClaims: ["exp", "iat", "sub", "auth_time"],
    }));
  } catch {
    throw new AuthError("Invalid token", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.sub !== "string" || payload.sub === "") {
    throw new AuthError("Invalid token", 401);
  }
  // jose checks `exp`; Firebase also requires these to be in the past.
  for (const claim of [payload.iat, payload.auth_time]) {
    if (typeof claim !== "number" || claim > now) {
      throw new AuthError("Invalid token", 401);
    }
  }
  if (payload.email_verified !== true) {
    throw new AuthError("Email not verified", 403);
  }
  return payload.sub;
}

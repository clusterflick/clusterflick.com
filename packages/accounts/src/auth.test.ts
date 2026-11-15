import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTPayload,
} from "jose";
import { describe, expect, it } from "vitest";
import { AuthError, getBearerToken, verifyFirebaseToken } from "./auth";

const PROJECT = "clusterflick-test";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const KEYS = createLocalJWKSet({
  keys: [{ ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" }],
});

function sign(claims: JWTPayload = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    sub: "reader1",
    iat: now - 60,
    exp: now + 3600,
    auth_time: now - 60,
    email_verified: true,
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .sign(privateKey);
}

const verify = (token: string) => verifyFirebaseToken(token, PROJECT, KEYS);

async function refusal(token: string) {
  try {
    await verify(token);
  } catch (error) {
    expect(error).toBeInstanceOf(AuthError);
    return (error as AuthError).status;
  }
  throw new Error("The token was accepted");
}

describe("verifyFirebaseToken", () => {
  it("gives the uid of a token the site's sign-in made", async () => {
    expect(await verify(await sign())).toBe("reader1");
  });

  const later = Math.floor(Date.now() / 1000) + 600;

  it.each([
    ["another project's", { aud: "someone-else" }],
    ["another issuer's", { iss: "https://example.com" }],
    ["an expired", { exp: Math.floor(Date.now() / 1000) - 1 }],
    ["a future-issued", { iat: later }],
    ["a future-signed-in", { auth_time: later }],
    ["a no-uid", { sub: "" }],
    ["a no-sign-in-time", { auth_time: undefined }],
  ])("refuses %s token", async (_, claims) => {
    expect(await refusal(await sign(claims))).toBe(401);
  });

  it("refuses a token signed with another key", async () => {
    const other = await generateKeyPair("RS256");
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      iss: `https://securetoken.google.com/${PROJECT}`,
      aud: PROJECT,
      sub: "reader1",
      iat: now - 60,
      exp: now + 3600,
      auth_time: now - 60,
      email_verified: true,
    })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .sign(other.privateKey);
    expect(await refusal(token)).toBe(401);
  });

  it("refuses anything that isn't a token", async () => {
    expect(await refusal("not-a-token")).toBe(401);
  });

  it("refuses an unverified address as forbidden, not unsigned-in", async () => {
    expect(await refusal(await sign({ email_verified: false }))).toBe(403);
  });
});

describe("getBearerToken", () => {
  const withHeader = (value?: string) =>
    new Request("https://example.com", {
      headers: value ? { Authorization: value } : {},
    });

  it("reads a bearer token, whatever the scheme's case", () => {
    expect(getBearerToken(withHeader("Bearer abc"))).toBe("abc");
    expect(getBearerToken(withHeader("bearer abc"))).toBe("abc");
  });

  it.each([undefined, "Basic abc", "Bearer", "Bearer a b"])(
    "finds none in %o",
    (value) => {
      expect(getBearerToken(withHeader(value))).toBeUndefined();
    },
  );
});

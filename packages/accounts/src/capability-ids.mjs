/**
 * The features granted one account at a time: each is a key of
 * `users/{uid}/meta/capabilities`, holding when it was granted. Granted is the
 * key being there, as the site's rules read it.
 *
 * The one list of them. The site's `CapabilityId` and its grant script
 * (`scripts/lib/capabilities.js`) are both read from it, and a Worker checks
 * one by these names. Plain ESM with no imports, as the catalogue's
 * `data-format.mjs` is, so the grant script loads it under raw Node.
 */

export const CapabilityId = Object.freeze({
  EmailAlerts: "emailAlerts",
  PublicProfile: "publicProfile",
  /** Searching the listings from the reader's own AI assistant (api-mcp). */
  AssistantAccess: "assistantAccess",
});

/** Every capability id, for a script that checks one it was given. */
export const CAPABILITY_IDS = Object.freeze(Object.values(CapabilityId));

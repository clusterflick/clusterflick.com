/**
 * The decisions behind scripts/grant-capability.js, kept free of Firestore so
 * they can be tested.
 *
 * The ids repeat `CapabilityId` in `@/lib/user-capabilities`, since a plain
 * Node script can't load the site's TypeScript; a test holds the two to each
 * other.
 */

const CAPABILITY_IDS = ["emailAlerts", "publicProfile"];

const USAGE = [
  "Usage: npm run grant-capability -- <email> <capability> [--revoke] [--write]",
  `Capabilities: ${CAPABILITY_IDS.join(", ")}`,
].join("\n");

/**
 * The command line, or a thrown error naming what's wrong. An unknown
 * capability is refused rather than written: the site ignores ids it doesn't
 * know, so a typo would be a grant that silently does nothing.
 */
function parseArgs(argv) {
  const flags = argv.filter((arg) => arg.startsWith("--"));
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  const unknownFlags = flags.filter(
    (flag) => flag !== "--write" && flag !== "--revoke",
  );
  if (unknownFlags.length > 0) {
    throw new Error(`Unknown option ${unknownFlags.join(", ")}\n${USAGE}`);
  }
  if (positional.length !== 2) throw new Error(USAGE);
  const [email, capability] = positional;
  if (!email.includes("@")) {
    throw new Error(`"${email}" isn't an email address\n${USAGE}`);
  }
  if (!CAPABILITY_IDS.includes(capability)) {
    throw new Error(`Unknown capability "${capability}"\n${USAGE}`);
  }
  return {
    email,
    capability,
    revoke: flags.includes("--revoke"),
    write: flags.includes("--write"),
  };
}

/**
 * What a grant or revoke does to the stored capabilities: `null` when nothing
 * would change, so a repeated grant keeps its original `grantedAt`.
 */
function planChange(stored = {}, { capability, revoke }, now) {
  const has = capability in stored;
  if (revoke ? !has : has) return null;
  const next = { ...stored };
  if (revoke) delete next[capability];
  else next[capability] = { grantedAt: now };
  return next;
}

module.exports = { CAPABILITY_IDS, parseArgs, planChange };

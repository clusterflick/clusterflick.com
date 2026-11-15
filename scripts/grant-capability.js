/* eslint-disable */
/**
 * Grants or revokes a capability for one reader, by the address they sign in
 * with. See "Capabilities" under Personalisation in CLAUDE.md.
 *
 *   npm run grant-capability -- reader@example.com emailAlerts           # dry run
 *   npm run grant-capability -- reader@example.com emailAlerts --write   # grants
 *   npm run grant-capability -- reader@example.com emailAlerts --revoke --write
 *
 * Needs, in the environment or .env:
 *   GOOGLE_APPLICATION_CREDENTIALS  path to a service-account key JSON
 *                                   (Firebase console → Project settings →
 *                                   Service accounts → Generate new private key)
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID the project, as for the site
 *   PROFILES_PURGE_SECRET           for publicProfile with --write: see
 *                                   scripts/lib/purge-profile.js
 *
 * The key can read and write every reader's data: keep it out of the
 * repository.
 *
 * Writes `users/{uid}/meta/capabilities`, which the rules let the reader read
 * and never write. The reader sees it on their next visit to /personalise
 * (it's read once a session). A reader who hasn't signed up has no account to
 * grant to, and the script says so rather than creating one.
 *
 * Granting or revoking publicProfile changes whether the reader's profile is
 * shown, so the profile's cached copy is purged after the write; a purge that
 * fails is an error, saying the write itself went through.
 */
const { parseArgs, planChange } = require("./lib/capabilities");
const { getPurgeConfig, purgeProfile } = require("./lib/purge-profile");

function loadEnv() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // No .env: the environment has to carry it all.
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; see the top of this script`);
  return value;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadEnv();
  requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  // Before anything is written, so a missing secret can't leave a profile
  // cached as it was.
  const purge =
    args.write && args.capability === "publicProfile"
      ? getPurgeConfig()
      : undefined;

  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore } = require("firebase-admin/firestore");
  initializeApp({ credential: applicationDefault(), projectId });

  let user;
  try {
    user = await getAuth().getUserByEmail(args.email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new Error(`No account for ${args.email} in ${projectId}`);
    }
    throw error;
  }

  const ref = getFirestore()
    .collection("users")
    .doc(user.uid)
    .collection("meta")
    .doc("capabilities");
  const verb = args.revoke ? "revoke" : "grant";

  // A transaction, so two runs at once can't each drop the other's change.
  const next = await getFirestore().runTransaction(async (transaction) => {
    const stored = (await transaction.get(ref)).data();
    const change = planChange(stored, args, Date.now());
    if (args.write && change) {
      if (Object.keys(change).length === 0) transaction.delete(ref);
      else transaction.set(ref, change);
    }
    return change;
  });

  const who = `${args.email} (${user.uid}) in ${projectId}`;
  if (!next) {
    console.log(
      `Nothing to do: ${who} ${args.revoke ? "doesn't have" : "already has"} ${args.capability}.`,
    );
  } else if (args.write) {
    console.log(`Done: ${verb}ed ${args.capability} for ${who}.`);
    if (purge) {
      try {
        await purgeProfile(user.uid, purge);
      } catch (error) {
        throw new Error(
          `${error.message}. The ${verb} is saved; their profile may show as it was for up to 5 minutes.`,
        );
      }
      console.log("Purged their cached profile.");
    }
  } else {
    console.log(
      `Dry run: would ${verb} ${args.capability} for ${who}. Run with --write to apply.`,
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

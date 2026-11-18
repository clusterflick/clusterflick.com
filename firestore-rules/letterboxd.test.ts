import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteApp, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  setLogLevel,
  type Firestore,
} from "firebase/firestore/lite";
import { doc as fullDoc, setDoc as fullSetDoc } from "firebase/firestore";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import {
  deleteLetterboxdSync,
  fetchLetterboxdLedger,
  fetchLetterboxdLink,
  toLetterboxdLinkDocument,
  unlinkLetterboxd,
} from "@/lib/user-letterboxd";

// The project `npm run test:rules` starts the emulator for; a demo- project
// can never reach a real one.
const PROJECT_ID = "demo-clusterflick";
const [HOST, PORT] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"
).split(":");

let env: RulesTestEnvironment;
const apps: FirebaseApp[] = [];

/**
 * Firestore Lite signed in as `uid`, as the site uses it: by email link, so
 * with a verified address unless told otherwise.
 */
function signedInAs(uid: string, { verified = true } = {}): Firestore {
  const app = initializeApp({ projectId: PROJECT_ID }, `${uid}-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, Number(PORT), {
    mockUserToken: {
      sub: uid,
      user_id: uid,
      email: address(uid),
      email_verified: verified,
    },
  });
  return db;
}

const address = (uid: string) => `${uid}@example.com`;

/** Writes as the Admin SDK would, as the sync Worker does: no rules. */
async function seed(documents: Record<string, Record<string, unknown>>) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [docPath, data] of Object.entries(documents)) {
      await fullSetDoc(fullDoc(db, docPath), data);
    }
  });
}

const GRANTED = { letterboxdSync: { grantedAt: 1 } };
const LINK = toLetterboxdLinkDocument({
  username: "film_fan",
  memberId: "1Qma",
  linkedAt: 1,
});
const LEDGER = {
  runs: [{ on: "2026-11-16", at: 1, outcome: "nothingNew" }],
  unmatched: [],
};

beforeAll(async () => {
  setLogLevel("silent");
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: HOST,
      port: Number(PORT),
      rules: readFileSync(
        path.join(import.meta.dirname, "..", "firestore.rules"),
        "utf8",
      ),
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await Promise.all(apps.map((app) => deleteApp(app)));
  await env.cleanup();
});

describe("the Letterboxd link", () => {
  test("the reader can read it", async () => {
    await seed({ "users/alice/meta/letterboxd": LINK });
    expect(await fetchLetterboxdLink(signedInAs("alice"), "alice")).toEqual({
      username: "film_fan",
      memberId: "1Qma",
      linkedAt: 1,
    });
  });

  test("but never write it, even with the capability", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    await assertFails(
      setDoc(doc(signedInAs("alice"), "users/alice/meta/letterboxd"), LINK),
    );
  });

  test("and can unlink by deleting it", async () => {
    await seed({ "users/alice/meta/letterboxd": LINK });
    const alice = signedInAs("alice");
    await assertSucceeds(unlinkLetterboxd(alice, "alice"));
    expect(await fetchLetterboxdLink(alice, "alice")).toBeNull();
  });

  test("nobody else can read it", async () => {
    await seed({ "users/bob/meta/letterboxd": LINK });
    await assertFails(
      getDoc(doc(signedInAs("alice"), "users/bob/meta/letterboxd")),
    );
  });
});

describe("the Letterboxd ledger", () => {
  test("the reader can read it", async () => {
    await seed({ "users/alice/meta/letterboxd-ledger": LEDGER });
    expect(await fetchLetterboxdLedger(signedInAs("alice"), "alice")).toEqual(
      LEDGER,
    );
  });

  test("but never write it, or read anyone else's", async () => {
    const alice = signedInAs("alice");
    await assertFails(
      setDoc(doc(alice, "users/alice/meta/letterboxd-ledger"), LEDGER),
    );
    await seed({ "users/bob/meta/letterboxd-ledger": LEDGER });
    await assertFails(getDoc(doc(alice, "users/bob/meta/letterboxd-ledger")));
  });
});

test("deleting the account deletes both", async () => {
  await seed({
    "users/alice/meta/letterboxd": LINK,
    "users/alice/meta/letterboxd-ledger": LEDGER,
  });
  const alice = signedInAs("alice");
  await assertSucceeds(deleteLetterboxdSync(alice, "alice"));
  expect(await fetchLetterboxdLink(alice, "alice")).toBeNull();
  expect(await fetchLetterboxdLedger(alice, "alice")).toEqual({
    runs: [],
    unmatched: [],
  });
});

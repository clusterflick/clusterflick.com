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
  DEFAULT_ALERT_SETTINGS,
  deleteAlerts,
  fetchAlertLedger,
  fetchAlertSettings,
  saveAlertSettings,
} from "@/lib/user-alerts";

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

/** Writes as the Admin SDK would, as the alerts Worker does: no rules. */
async function seed(documents: Record<string, Record<string, unknown>>) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [docPath, data] of Object.entries(documents)) {
      await fullSetDoc(fullDoc(db, docPath), data);
    }
  });
}

const GRANTED = { emailAlerts: { grantedAt: 1 } };
const ON = { ...DEFAULT_ALERT_SETTINGS, enabled: true };

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

describe("alert settings", () => {
  test("a reader with the capability can switch them on", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    await assertSucceeds(
      saveAlertSettings(alice, "alice", ON, address("alice")),
    );
    expect(await fetchAlertSettings(alice, "alice")).toEqual(ON);
  });

  test("not without the capability", async () => {
    await assertFails(
      saveAlertSettings(signedInAs("alice"), "alice", ON, address("alice")),
    );
  });

  test("but anyone can save them switched off, to stop them", async () => {
    await seed({ "users/alice/meta/alerts": { ...ON } });
    await assertSucceeds(
      saveAlertSettings(
        signedInAs("alice"),
        "alice",
        DEFAULT_ALERT_SETTINGS,
        address("alice"),
      ),
    );
  });

  test("only to the address they're signed in with", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    await assertFails(
      saveAlertSettings(
        signedInAs("alice"),
        "alice",
        ON,
        "someone-else@example.com",
      ),
    );
  });

  test("and only once it's verified", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    await assertFails(
      saveAlertSettings(
        signedInAs("alice", { verified: false }),
        "alice",
        ON,
        address("alice"),
      ),
    );
  });

  test("only their own", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    await assertFails(
      saveAlertSettings(signedInAs("bob"), "alice", ON, address("bob")),
    );
    await assertFails(fetchAlertSettings(signedInAs("bob"), "alice"));
  });

  test.each([
    ["an unknown field", { enabled: false, alerts: [], extra: 1 }],
    ["no alerts list", { enabled: false }],
    ["no address", { enabled: false, alerts: [] }],
    ["enabled that isn't a boolean", { enabled: "yes", alerts: [] }],
    [
      "two alerts",
      {
        enabled: false,
        alerts: [
          { type: "watchlist", notify: ["newVenue"] },
          { type: "watchlist", notify: ["newVenue"] },
        ],
      },
    ],
    [
      "an alert of another type",
      { enabled: false, alerts: [{ type: "venue", notify: ["newVenue"] }] },
    ],
    [
      "an unknown trigger",
      { enabled: false, alerts: [{ type: "watchlist", notify: ["daily"] }] },
    ],
    [
      "no trigger",
      { enabled: false, alerts: [{ type: "watchlist", notify: [] }] },
    ],
  ])("refuse %s", async (name, data) => {
    const db = signedInAs("alice");
    // Each with the right address, so it's refused for its own reason.
    const withAddress =
      name === "no address" ? data : { ...data, email: address("alice") };
    await assertFails(setDoc(doc(db, "users/alice/meta/alerts"), withAddress));
  });
});

describe("the alert ledger", () => {
  const LEDGER = {
    runs: [{ on: "2026-11-16", at: 1, outcome: "nothingNew" }],
  };

  test("the reader can read it", async () => {
    await seed({ "users/alice/meta/alert-ledger": LEDGER });
    expect(await fetchAlertLedger(signedInAs("alice"), "alice")).toEqual(
      LEDGER,
    );
  });

  test("but never write it, or read anyone else's", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    await assertFails(
      setDoc(doc(alice, "users/alice/meta/alert-ledger"), LEDGER),
    );
    await seed({ "users/bob/meta/alert-ledger": LEDGER });
    await assertFails(getDoc(doc(alice, "users/bob/meta/alert-ledger")));
  });
});

test("deleting the account deletes both", async () => {
  await seed({
    "users/alice/meta/alerts": { ...ON },
    "users/alice/meta/alert-ledger": { runs: [] },
  });
  const alice = signedInAs("alice");
  await assertSucceeds(deleteAlerts(alice, "alice"));
  expect(await fetchAlertSettings(alice, "alice")).toBeNull();
});

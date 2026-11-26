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
  ALERT_LABEL_MAX_LENGTH,
  DEFAULT_ALERT_SETTINGS,
  DEFAULT_WATCHLIST_TRIGGERS,
  MAX_ALERTS,
  SEARCH_QUERY_MAX_LENGTH,
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

/** A saved search as the site writes one, with these fields changed. */
const searchAlert = (extra: Record<string, unknown> = {}) => ({
  type: "search",
  id: "s1",
  query: "venues=rio",
  notify: ["firstListing"],
  newVenueScope: "any",
  ...extra,
});

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

  test("only at favourite venues, or as saved before there was a choice", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    const favourites = {
      ...ON,
      alerts: [{ ...ON.alerts[0], newVenueScope: "favourites" as const }],
    };
    await assertSucceeds(
      saveAlertSettings(alice, "alice", favourites, address("alice")),
    );
    expect(await fetchAlertSettings(alice, "alice")).toEqual(favourites);
    await assertSucceeds(
      setDoc(doc(alice, "users/alice/meta/alerts"), {
        enabled: true,
        email: address("alice"),
        alerts: [{ type: "watchlist", notify: ["newVenue"] }],
      }),
    );
  });

  test("with saved searches beside the watchlist, as many as allowed", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    const withSearches = {
      ...ON,
      alerts: [
        ...ON.alerts,
        ...Array.from({ length: MAX_ALERTS - 1 }, (_, n) => ({
          type: "search" as const,
          id: `s${n + 1}`,
          query: "venues=rio",
          label: `Rio ${n + 1}`,
          notify: [...DEFAULT_WATCHLIST_TRIGGERS],
          newVenueScope: "any" as const,
        })),
      ],
    };
    await assertSucceeds(
      saveAlertSettings(alice, "alice", withSearches, address("alice")),
    );
    expect(await fetchAlertSettings(alice, "alice")).toEqual(withSearches);
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
      "more alerts than a reader may have",
      {
        enabled: false,
        alerts: Array.from({ length: MAX_ALERTS + 1 }, (_, n) =>
          searchAlert({ id: `s${n + 1}` }),
        ),
      },
    ],
    [
      "a search alert with a bad id",
      { enabled: false, alerts: [searchAlert({ id: "Not An Id" })] },
    ],
    [
      "a search alert with no query",
      { enabled: false, alerts: [searchAlert({ query: "" })] },
    ],
    [
      "a search alert with too long a query",
      {
        enabled: false,
        alerts: [
          searchAlert({ query: "x".repeat(SEARCH_QUERY_MAX_LENGTH + 1) }),
        ],
      },
    ],
    [
      "a search alert with too long a name",
      {
        enabled: false,
        alerts: [
          searchAlert({ label: "x".repeat(ALERT_LABEL_MAX_LENGTH + 1) }),
        ],
      },
    ],
    [
      "a search alert with an unknown field",
      { enabled: false, alerts: [searchAlert({ filters: {} })] },
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
    [
      "an unknown new-venue scope",
      {
        enabled: false,
        alerts: [
          { type: "watchlist", notify: ["newVenue"], newVenueScope: "nearby" },
        ],
      },
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

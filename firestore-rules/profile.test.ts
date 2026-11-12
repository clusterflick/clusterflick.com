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
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  setLogLevel,
  writeBatch,
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
  deleteProfile,
  fetchProfile,
  isHandleTaken,
  saveProfile,
} from "@/lib/user-profile";

// The project `npm run test:rules` starts the emulator for; a demo- project
// can never reach a real one.
const PROJECT_ID = "demo-clusterflick";
const [HOST, PORT] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"
).split(":");

let env: RulesTestEnvironment;
const apps: FirebaseApp[] = [];

/**
 * Firestore Lite signed in as `uid`, as the site uses it, so the tests send
 * the same batches the site's own helpers do.
 */
function signedInAs(uid: string): Firestore {
  const app = initializeApp({ projectId: PROJECT_ID }, `${uid}-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, Number(PORT), {
    mockUserToken: { sub: uid, user_id: uid },
  });
  return db;
}

function signedOut(): Firestore {
  const app = initializeApp({ projectId: PROJECT_ID }, `anon-${apps.length}`);
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, Number(PORT));
  return db;
}

/** Writes as the Admin SDK would: the rules don't apply. */
async function seed(documents: Record<string, Record<string, unknown>>) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [docPath, data] of Object.entries(documents)) {
      await fullSetDoc(fullDoc(db, docPath), data);
    }
  });
}

async function read(docPath: string) {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (context) => {
    const { getDoc: fullGetDoc } = await import("firebase/firestore");
    data = (await fullGetDoc(fullDoc(context.firestore(), docPath))).data();
  });
  return data;
}

const GRANTED = { publicProfile: { grantedAt: 1 } };

/** A choice of what the page shows, as the site saves one. */
const SECTIONS = {
  seenStats: true,
  watchlist: false,
  favouriteVenues: false,
  seen: true,
};

beforeAll(async () => {
  // Every refusal a test expects would otherwise be logged as an error.
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

describe("claiming a handle", () => {
  test("a reader with the capability can claim one", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");

    await assertSucceeds(
      saveProfile(alice, "alice", { handle: "alice", public: false }, null),
    );
    expect(await read("handles/alice")).toEqual({ uid: "alice" });
    expect(await fetchProfile(alice, "alice")).toEqual({
      handle: "alice",
      public: false,
    });
  });

  test("not without the capability", async () => {
    await seed({ "users/bob/meta/capabilities": {} });
    await assertFails(
      saveProfile(
        signedInAs("bob"),
        "bob",
        { handle: "bob", public: false },
        null,
      ),
    );
  });

  test("not without a capabilities document at all", async () => {
    await assertFails(
      saveProfile(
        signedInAs("bob"),
        "bob",
        { handle: "bob", public: false },
        null,
      ),
    );
  });

  test("not one someone else holds", async () => {
    await seed({
      "users/alice/meta/capabilities": GRANTED,
      "users/alice/meta/profile": { handle: "film-fan", public: true },
      "handles/film-fan": { uid: "alice" },
      "users/bob/meta/capabilities": GRANTED,
    });
    const bob = signedInAs("bob");

    expect(await isHandleTaken(bob, "film-fan", "bob")).toBe(true);
    await assertFails(
      saveProfile(bob, "bob", { handle: "film-fan", public: false }, null),
    );
    expect(await read("handles/film-fan")).toEqual({ uid: "alice" });
  });

  test.each([
    ["too short", "ab"],
    ["too long", "a".repeat(31)],
    ["uppercase", "Alice"],
    ["other characters", "alice.b"],
    ["reserved", "admin"],
    ["reserved", "clusterflick"],
  ])("not one that's %s (%s)", async (_, handle) => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    await assertFails(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { handle, public: false },
        null,
      ),
    );
  });

  test("not a handle document on its own, without the profile", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    await assertFails(setDoc(doc(alice, "handles", "alice"), { uid: "alice" }));
  });

  test("not a handle document naming someone else", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    const batch = writeBatch(alice);
    batch.set(doc(alice, "handles", "alice"), { uid: "bob" });
    batch.set(doc(alice, "users", "alice", "meta", "profile"), {
      handle: "alice",
      public: false,
    });
    await assertFails(batch.commit());
  });

  test("not a profile with fields beyond handle and public", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    const batch = writeBatch(alice);
    batch.set(doc(alice, "handles", "alice"), { uid: "alice" });
    batch.set(doc(alice, "users", "alice", "meta", "profile"), {
      handle: "alice",
      public: false,
      email: "alice@example.com",
    });
    await assertFails(batch.commit());
  });

  test("not a handle document with fields beyond uid", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    const batch = writeBatch(alice);
    batch.set(doc(alice, "handles", "alice"), { uid: "alice", extra: true });
    batch.set(doc(alice, "users", "alice", "meta", "profile"), {
      handle: "alice",
      public: false,
    });
    await assertFails(batch.commit());
  });
});

describe("renaming", () => {
  const ALICE_PUBLIC = {
    "users/alice/meta/capabilities": GRANTED,
    "users/alice/meta/profile": { handle: "alice", public: true },
    "handles/alice": { uid: "alice" },
  };

  test("releases the old handle and claims the new one", async () => {
    await seed(ALICE_PUBLIC);
    await assertSucceeds(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { handle: "alice-b", public: true, sections: SECTIONS },
        { handle: "alice", public: true },
      ),
    );
    expect(await read("handles/alice")).toBeUndefined();
    expect(await read("handles/alice-b")).toEqual({ uid: "alice" });
  });

  test("not without the capability", async () => {
    await seed({ ...ALICE_PUBLIC, "users/alice/meta/capabilities": {} });
    await assertFails(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { handle: "alice-b", public: false },
        { handle: "alice", public: true },
      ),
    );
  });

  test("not by deleting another reader's handle", async () => {
    await seed({
      ...ALICE_PUBLIC,
      "users/bob/meta/capabilities": GRANTED,
    });
    const bob = signedInAs("bob");
    await assertFails(deleteDoc(doc(bob, "handles", "alice")));
  });

  test("not by deleting your own handle and keeping the profile", async () => {
    await seed(ALICE_PUBLIC);
    const alice = signedInAs("alice");
    await assertFails(deleteDoc(doc(alice, "handles", "alice")));
  });

  test("a handle is never updated in place", async () => {
    await seed(ALICE_PUBLIC);
    const alice = signedInAs("alice");
    await assertFails(setDoc(doc(alice, "handles", "alice"), { uid: "alice" }));
  });
});

describe("the public switch", () => {
  test("can be turned on with the capability, once sections are chosen", async () => {
    await seed({
      "users/alice/meta/capabilities": GRANTED,
      "users/alice/meta/profile": {
        handle: "alice",
        public: false,
        sections: SECTIONS,
      },
      "handles/alice": { uid: "alice" },
    });
    const previous = { handle: "alice", public: false, sections: SECTIONS };
    await assertSucceeds(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, public: true },
        previous,
      ),
    );
  });

  test("can't be turned on before sections are chosen", async () => {
    await seed({
      "users/alice/meta/capabilities": GRANTED,
      "users/alice/meta/profile": { handle: "alice", public: false },
      "handles/alice": { uid: "alice" },
    });
    const previous = { handle: "alice", public: false };
    await assertFails(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, public: true },
        previous,
      ),
    );
  });

  test("a profile can't be claimed public in one go without sections", async () => {
    await seed({ "users/alice/meta/capabilities": GRANTED });
    const alice = signedInAs("alice");
    await assertFails(
      saveProfile(alice, "alice", { handle: "alice", public: true }, null),
    );
    await assertSucceeds(
      saveProfile(
        alice,
        "alice",
        { handle: "alice", public: true, sections: SECTIONS },
        null,
      ),
    );
  });

  test("can't be turned on once the capability is revoked", async () => {
    await seed({
      "users/alice/meta/capabilities": {},
      "users/alice/meta/profile": {
        handle: "alice",
        public: false,
        sections: SECTIONS,
      },
      "handles/alice": { uid: "alice" },
    });
    const previous = { handle: "alice", public: false, sections: SECTIONS };
    await assertFails(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, public: true },
        previous,
      ),
    );
  });

  test("can always be turned off, capability or not", async () => {
    await seed({
      "users/alice/meta/profile": { handle: "alice", public: true },
      "handles/alice": { uid: "alice" },
    });
    const previous = { handle: "alice", public: true };
    await assertSucceeds(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, public: false },
        previous,
      ),
    );
  });

  test("must be a boolean", async () => {
    await seed({
      "users/alice/meta/capabilities": GRANTED,
      "users/alice/meta/profile": { handle: "alice", public: false },
      "handles/alice": { uid: "alice" },
    });
    const alice = signedInAs("alice");
    await assertFails(
      setDoc(doc(alice, "users", "alice", "meta", "profile"), {
        handle: "alice",
        public: "yes",
      }),
    );
  });
});

describe("sections", () => {
  const PRIVATE = {
    "users/alice/meta/capabilities": GRANTED,
    "users/alice/meta/profile": { handle: "alice", public: false },
    "handles/alice": { uid: "alice" },
  };
  const profileDoc = (db: Firestore) =>
    doc(db, "users", "alice", "meta", "profile");

  test("can be chosen while the profile is private", async () => {
    await seed(PRIVATE);
    const previous = { handle: "alice", public: false };
    await assertSucceeds(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, sections: SECTIONS },
        previous,
      ),
    );
    expect(await read("users/alice/meta/profile")).toEqual({
      ...previous,
      sections: SECTIONS,
    });
  });

  const withoutSeen = Object.fromEntries(
    Object.entries(SECTIONS).filter(([id]) => id !== "seen"),
  );
  test.each<[string, unknown]>([
    ["one missing", withoutSeen],
    ["one extra", { ...SECTIONS, email: true }],
    ["one that isn't a boolean", { ...SECTIONS, seen: "yes" }],
    ["not a map", true],
  ])("not with %s", async (_, sections) => {
    await seed(PRIVATE);
    const alice = signedInAs("alice");
    await assertFails(
      setDoc(profileDoc(alice), { handle: "alice", public: false, sections }),
    );
  });

  test("can't be taken off a public profile", async () => {
    await seed({
      ...PRIVATE,
      "users/alice/meta/profile": {
        handle: "alice",
        public: true,
        sections: SECTIONS,
      },
    });
    const alice = signedInAs("alice");
    await assertFails(
      setDoc(profileDoc(alice), { handle: "alice", public: true }),
    );
  });

  test("a profile public from before them can be switched off as it is", async () => {
    await seed({
      ...PRIVATE,
      "users/alice/meta/profile": { handle: "alice", public: true },
    });
    const previous = { handle: "alice", public: true };
    await assertSucceeds(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { ...previous, public: false },
        previous,
      ),
    );
  });

  test("a profile public from before them must choose them to change", async () => {
    await seed({
      ...PRIVATE,
      "users/alice/meta/profile": { handle: "alice", public: true },
    });
    const previous = { handle: "alice", public: true };
    await assertFails(
      saveProfile(
        signedInAs("alice"),
        "alice",
        { handle: "alice-b", public: true },
        previous,
      ),
    );
  });

  test("can't be changed once the capability is revoked, even switching off", async () => {
    await seed({
      "users/alice/meta/profile": {
        handle: "alice",
        public: true,
        sections: SECTIONS,
      },
      "handles/alice": { uid: "alice" },
    });
    const previous = { handle: "alice", public: true, sections: SECTIONS };
    const alice = signedInAs("alice");
    await assertFails(
      saveProfile(
        alice,
        "alice",
        { ...previous, public: false, sections: { ...SECTIONS, seen: false } },
        previous,
      ),
    );
    // Switching off alone still works.
    await assertSucceeds(
      saveProfile(alice, "alice", { ...previous, public: false }, previous),
    );
  });
});

describe("reading", () => {
  const SEEDED = {
    "users/alice/meta/profile": { handle: "alice", public: true },
    "handles/alice": { uid: "alice" },
  };

  test("a profile only by its owner", async () => {
    await seed(SEEDED);
    await assertSucceeds(fetchProfile(signedInAs("alice"), "alice"));
    await assertFails(fetchProfile(signedInAs("bob"), "alice"));
    await assertFails(fetchProfile(signedOut(), "alice"));
  });

  test("a handle by any signed-in reader, not signed out", async () => {
    await seed(SEEDED);
    await assertSucceeds(getDoc(doc(signedInAs("bob"), "handles", "alice")));
    await assertFails(getDoc(doc(signedOut(), "handles", "alice")));
  });

  test("handles can't be listed", async () => {
    await seed(SEEDED);
    await assertFails(getDocs(collection(signedInAs("bob"), "handles")));
  });
});

describe("deleting", () => {
  test("the profile and its handle go together", async () => {
    await seed({
      "users/alice/meta/profile": { handle: "alice", public: true },
      "handles/alice": { uid: "alice" },
    });
    // No capability: a revoked reader can still delete their account.
    await assertSucceeds(deleteProfile(signedInAs("alice"), "alice"));
    expect(await read("users/alice/meta/profile")).toBeUndefined();
    expect(await read("handles/alice")).toBeUndefined();
  });

  test("not the profile alone, which would orphan its handle", async () => {
    await seed({
      "users/alice/meta/profile": { handle: "alice", public: true },
      "handles/alice": { uid: "alice" },
    });
    const alice = signedInAs("alice");
    await assertFails(
      deleteDoc(doc(alice, "users", "alice", "meta", "profile")),
    );
  });

  test("not someone else's", async () => {
    await seed({
      "users/alice/meta/profile": { handle: "alice", public: true },
      "handles/alice": { uid: "alice" },
    });
    const bob = signedInAs("bob");
    const batch = writeBatch(bob);
    batch.delete(doc(bob, "handles", "alice"));
    batch.delete(doc(bob, "users", "alice", "meta", "profile"));
    await assertFails(batch.commit());
  });

  test("with no profile, nothing to do", async () => {
    await assertSucceeds(deleteProfile(signedInAs("alice"), "alice"));
  });
});

describe("the capability itself", () => {
  // Everything above rests on this: a reader who could write it could
  // publish without being granted it.
  test("a reader can read it but never grant it to themselves", async () => {
    await seed({ "users/bob/meta/capabilities": {} });
    const bob = signedInAs("bob");
    await assertSucceeds(
      getDoc(doc(bob, "users", "bob", "meta", "capabilities")),
    );
    await assertFails(
      setDoc(doc(bob, "users", "bob", "meta", "capabilities"), GRANTED),
    );
  });
});

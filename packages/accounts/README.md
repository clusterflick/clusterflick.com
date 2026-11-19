# @clusterflick/accounts

A [Clusterflick](https://clusterflick.com) reader's account, as a Worker reads
it: who is calling, from the Firebase ID token the site's pages send; Firestore,
over its REST API with the Worker's own service account; and what the reader
has there, their lists and the features granted to them. The Workers that act
for a reader share it (`api-profiles`, `api-tmdb-search`, `api-mcp`, and the
alerts after them), so each reads an account the same way the site does.

It lives in the site's repo (`clusterflick/clusterflick.com`), as an npm
workspace, beside `@clusterflick/catalogue`: the documents it reads are the
site's, and a change to their shape comes with a change to the site.

## Using it

Import modules by their subpaths, which follow `src/`:

```ts
import {
  verifyFirebaseToken,
  getBearerToken,
} from "@clusterflick/accounts/auth";
import { getAccessToken } from "@clusterflick/accounts/google-auth";
import { Firestore } from "@clusterflick/accounts/firestore";
import { readList } from "@clusterflick/accounts/lists";
import { hasCapability } from "@clusterflick/accounts/capabilities";

const uid = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
const db = new Firestore(env.FIREBASE_PROJECT_ID, () =>
  getAccessToken(env.FIREBASE_SERVICE_ACCOUNT),
);
if (await hasCapability(db, uid, "emailAlerts")) {
  const [user] = await db.batchGet([`users/${uid}`], ["watchlist"]);
  const watchlist = readList(user?.watchlist);
}
```

- **`auth`**: `verifyFirebaseToken` checks an ID token as the Admin SDK would
  and gives the uid, or throws `AuthError` with the status to answer (401, or
  403 for an unverified address).
- **`google-auth`**: `getAccessToken` signs a JWT with the service account's key
  (`FIREBASE_SERVICE_ACCOUNT`, the key file's JSON) and exchanges it at Google's
  token endpoint. The token is kept in the isolate until five minutes before it
  expires, and requests that arrive together share one exchange.
- **`firestore`**: `get` and `batchGet` with a field mask, and `decodeValue` for
  REST's typed values. `getVersioned` reads a document with the time it was
  last written, and `commit` writes several documents at once, each with an
  optional precondition (unchanged since that time, or there or not), throwing
  `PreconditionError` when one fails so the caller can read again: that's how
  the alerts Worker claims a reader's digest before sending it.
  `findInCollectionGroup` finds the documents of a collection id at any depth
  whose field equals a value, which needs a collection-group index on that
  field (`firestore.indexes.json`). `isUid` says whether a value is safe to put in a path:
  a service account skips the security rules, so nothing else is.
- **`lists`**: the watchlist, Seen list, favourite venues and film details,
  decoded with the same rules as the site's `parseProfilePageData`.
- **`capabilities`**: `hasCapability`, and `RememberedCapability` for a Worker
  that checks on every call, which remembers each answer for a set time.
  `CapabilityId` and `CAPABILITY_IDS` are the one list of capabilities: the
  site and its grant script read them from `capability-ids.mjs`.

- **`alerts`**: a reader's email alert settings (`users/{uid}/meta/alerts`,
  which they write) and the ledger the alerts Worker keeps of each night's run
  (`users/{uid}/meta/alert-ledger`, which only the Worker writes), parsed from
  plain values: the site passes a snapshot's data, a Worker `decodeFields` of
  what Firestore sent. `firestore.rules` repeats the settings' shape, held to
  this module by a test.

- **`list-writes`**: films added to a reader's lists by a Worker, with the
  site's rules: each film with its details for `users/{uid}/meta/films`, a
  listed film's entry left as it is, and everything already stored kept as it
  was stored. `addToLists` works out both documents' new fields from the
  documents as read, for the caller to commit together with an `updateTime`
  precondition on each. It never takes a film off the watchlist.
- **`letterboxd`**: the Letterboxd sync's link (`users/{uid}/meta/letterboxd`)
  and ledger (`users/{uid}/meta/letterboxd-ledger`), both written only by the
  sync Worker (clusterflick/api-letterboxd), parsed for the site to show.
- **`imdb`**: the IMDb sync's link (`users/{uid}/meta/imdb`) and ledger
  (`users/{uid}/meta/imdb-ledger`), the same shape as Letterboxd's and written
  only by its sync Worker (clusterflick/api-imdb); and `readImdbUser`, which
  finds the user id in what a reader typed or pasted.

Anything Firestore can't answer throws `UpstreamError`, rather than being read
as "no". It's plain ESM with type declarations; its one dependency is `jose`.
It uses only `fetch` and Web Crypto, so it runs in a Worker and in Node.

## Working on it

The site compiles this source directly (its `tsconfig.json` `paths` and
`vitest.config.ts` alias), and its tests run with the site's. From the repo
root:

- `npm test -w @clusterflick/accounts` runs only the package's tests.
- `npm run check -w @clusterflick/accounts` builds `dist/` and imports every
  subpath from it in Node, as a Worker's bundler would find them. CI runs it.

## Publishing

As the catalogue's: a release is a version bump in `package.json`, pushed to
`main`. `.github/workflows/publish-accounts.yml` publishes a version npm doesn't
have yet with npm's trusted publishing, then waits for npm's malware scan to
make it installable. A change to a function's signature is a major version
while the Workers depend on it. 0.1.0 was published by hand, before the package
existed for its trusted publisher to be configured.

## Licence

MIT, as the site.

# @clusterflick/catalogue

What [Clusterflick](https://clusterflick.com)'s London cinema listings are, and
how they're searched: the data model, the filters, places, the occasion rules,
the festival and film-club registries, London's stations and the London-time
date helpers. The site and the Workers that serve its listings share it, so a
search means the same thing everywhere.

It lives in the site's repo (`clusterflick/clusterflick.com`), as an npm
workspace, because nearly every change to it comes with a change to the site.

## Using it

Import modules by their subpaths, which follow `src/`:

```ts
import { matchAny, getDefaultState } from "@clusterflick/catalogue/filters";
import type { Movie, MoviePerformance } from "@clusterflick/catalogue/types";
import { getNearbyVenueIds } from "@clusterflick/catalogue/places";
import { formatShowingTime } from "@clusterflick/catalogue/utils/format-date";
```

The filters run on the listings in the shape the site publishes them, not on
the pipeline's combined data: the site's build joins in the ratings, each
venue's last performance and more (`scripts/process-combined-data.js`).

It's plain ESM with type declarations and no dependencies, and runs in a
browser, in Node and in a Worker. It has no React, and never reads `window`,
`document` or `process`.

## What goes in

Code about the listings that something outside the site needs. Anything only
the site uses stays in the site, even when it's about the listings. A reader's
lists (Seen, the watchlist, their invariants) are a different concern, and
would be a package of their own.

## Working on it

The site compiles this source directly (its `tsconfig.json` `paths` and
`vitest.config.ts` alias), so there's nothing to build while working on it:
change a file and the site and its tests see it. The tests sit beside the code
and run with the site's, `npm test` from the repo root.

From the repo root:

- `npm run build -w @clusterflick/catalogue` writes `dist/`: a module per source
  file (shared code split into chunks) and their type declarations, built
  against the web standards a browser, Node and a Worker share, with no DOM and
  no Node types.
- `npm run check -w @clusterflick/catalogue` builds it and imports every subpath
  from `dist/` in Node, as a Worker's bundler would find them. CI runs it.

## Publishing

A release is a version bump in `package.json`, pushed to `main` (semver: a
change to the data model or to a function's signature is a major version while
the Workers depend on it). `.github/workflows/publish-catalogue.yml` runs on
every push that touches the package and publishes only a version npm doesn't
have yet, after the site's tests and `check`; a push without a bump finds its
version already published and stops.

It publishes with npm's trusted publishing: the workflow proves who it is with
an OIDC token, so no npm token is stored anywhere, and each release carries
provenance linking it to the commit and run that built it. The trusted
publisher is configured in the package's settings on npmjs.com and names that
workflow file, so renaming the file means updating it there. 0.1.0 was
published by hand, before the package existed to configure.

## Licence

MIT, as the site.

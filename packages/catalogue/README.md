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

## Reading the listings

The site publishes them under `https://clusterflick.com/data/`, every file
named by its content's hash except one: `current.json` (`CURRENT_DATA_FILE`), a
`CurrentData`, names the current meta file, a `MetaData`, whose `filenames` are
the movie chunks. Each is a `Record<string, Movie>`.

```ts
import {
  CURRENT_DATA_FILE,
  DATA_FORMAT_VERSION,
} from "@clusterflick/catalogue/data-format.mjs";
```

`DATA_FORMAT_VERSION` is the shape this version of the package reads. Both
`current.json` and the meta file carry the version they were published in;
read neither when it differs. It's raised, with a major version of this
package, when a change would break a reader built against the old shape.

`utils/fetch-listings` does all of that for you: `fetchCurrentRelease(origin)`
names the current meta file (one small fetch, never from a cache), and
`fetchRelease(origin, metaFile)` reads that release as the site does. Any
failure, a data format this version doesn't read included, is a
`ListingsUnavailableError`. How long to hold them, and what to do when they
can't be read, is the caller's: the MCP server keeps the last good copy, the
alerts Worker fails the night's run.

It's plain ESM with type declarations, and runs in a browser, in Node and in a
Worker. Its one dependency is `@sindresorhus/slugify`, which makes the film and
venue pages' addresses (`utils/get-movie-url`, `utils/get-venue-url`), so a
link from anywhere is the page the site built. It has no React, and never reads `window`,
`document` or `process`.

## Film URLs that moved

`utils/movie-url-map` is the shape of the site's `/movie-urls.json`
(`MovieUrlMap`, `MOVIE_URL_MAP_VERSION`) and the rules that read it.
`resolve(path, map)` is what the movie-redirects Worker does with a 404 under
`/movies/*`: a 301 for a known id or a matched listing's old id, a 302 for one
showing film under the slug or close to it, and otherwise the 404.
`findLostUrls(previous, current)` lists every film URL a deploy left behind,
why it went, and what `resolve` does with it now, which is how data-analysed
reports a deploy's 404s before anyone follows one. The site builds the map
itself (`src/utils/get-movie-url-map.ts`), since that needs Node's crypto.

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
- `npm test -w @clusterflick/catalogue` runs only the package's tests, with its
  own `vitest.config.ts`: the site's also loads Storybook, which needs the
  site's data downloaded. The publish workflow runs it; CI runs these tests
  with the site's.

## Publishing

A release is a version bump in `package.json`, pushed to `main` (semver: a
change to the data model or to a function's signature is a major version while
the Workers depend on it). `.github/workflows/publish-catalogue.yml` runs on
every push that touches the package and publishes only a version npm doesn't
have yet, after the package's tests and `check`; a push without a bump finds its
version already published and stops. npm scans a new version for malware before
it can be installed, typically for about five minutes, so the workflow then
waits until the version is available, and fails if it isn't within 30 minutes
(npm may have held it for review or blocked it). A push during that wait queues
behind it.

It publishes with npm's trusted publishing: the workflow proves who it is with
an OIDC token, so no npm token is stored anywhere, and each release carries
provenance linking it to the commit and run that built it. The trusted
publisher is configured in the package's settings on npmjs.com and names that
workflow file, so renaming the file means updating it there. 0.1.0 was
published by hand, before the package existed to configure.

## Licence

MIT, as the site.

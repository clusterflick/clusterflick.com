# Personalisation

Accounts, lists, film details, capabilities, public profiles and AI assistant access.

`/personalise` is where a reader signs in and manages their lists (watchlist,
seen). Accounts exist to hold those lists, and the page is framed around them
rather than around an account.

**Firebase, entirely client-side.** The site is a static export, so the browser
talks to Firebase Auth and Firestore directly and the Firestore security rules
(`firestore.rules`, deployed with the Firebase CLI via `firebase.json`) are the
only thing guarding the data. The `NEXT_PUBLIC_FIREBASE_*` web config is public
by design, set as repository _variables_ in `generate_site.yml`, and listed in
`.env.example` for local use. **When it is absent the feature switches itself
off** (`isFirebaseConfigured`, status `unavailable`), which is what keeps local
builds, Storybook, Chromatic and CI working without a project.

**Sign-up and sign-in are one action.** Email-link ("magic link") sign-in
creates the account the first time a link is redeemed, so there is no
registration page. The link returns to `/personalise/`, which redeems it. The
address must be supplied again to redeem it — the link deliberately doesn't
carry it, so an intercepted link is useless on its own — which is why it is
parked in `localStorage` (not `sessionStorage`: the link opens in a new tab),
deleted on use, and ignored after an hour. Opened in another browser, the page
asks for the address instead.

**Nobody pays for the SDK who doesn't use it.** `loadFirebase` dynamically
imports it, and the `UserProvider` (`@/state/user-context`) only calls it for a
visitor carrying the `clusterflick-signed-in` flag, or when sign-in starts. The
flag holds no personal data; if it outlives the session the SDK loads, reports
nobody and clears it. Keep every `firebase/*` import dynamic or type-only —
one static import puts the SDK in every page's bundle. Firestore is
`firebase/firestore/lite`: lists need neither realtime listeners nor offline
caching. Auth is `initializeAuth` rather than `getAuth`, which would bundle the
popup/redirect resolvers email links never use.

**Every write goes through `commitUserWrite`** (`@/lib/firebase/commit-user-write`).
It takes a function that adds writes to a batch, commits it, and then purges
the reader's cached public profile (`POST /api/profiles/purge` on the profiles
Worker, with their ID token), so a profile shows a change on its next view
rather than up to five minutes later. Lint refuses `writeBatch`, `setDoc`,
`updateDoc`, `deleteDoc`, `addDoc` and `runTransaction` anywhere else, in any
form of import (`eslint.config.mjs`), because a write that skipped the purge
would leave a profile showing what it no longer holds. A failed commit
throws, as before. A failed purge, retried twice, doesn't: the write
happened, and the copy expires on its own. The result's `purged` says which,
and the settings page tells a reader who has just gone private that their
profile may still show for up to five minutes. A profile save names its old
and new handles (`purgeHandles`), as the Worker finds a reader's copies by uid
and can't know a handle just taken. The scripts that write as the service
account (`grant-capability` for `publicProfile`, `migrate-film-details`) purge
with the Worker's secret, `PROFILES_PURGE_SECRET`
(`scripts/lib/purge-profile.js`), checked before they write.

**Storage is one document per user at `users/{uid}`**, every list a map of
movie id → `UserListEntry`. One read per session. The entry snapshots title,
year and poster because a listed film outlives its run — once it leaves the
dataset and later its departed page, the snapshot is all there is. The id is
the same one the film's URL is built from, so it is stable across releases; the
slug is derived from the title, as `getMovieUrl` does. The rules restrict the
document to the list fields, so a new list needs a rules change too.

**Film details live in a second document, `users/{uid}/meta/films`**
(`@/lib/user-lists/film-details`): each listed film's genres, directors,
top-billed cast, runtime and language, with names stored once in a `people`
map. They are for stats on the Seen list and filtering the watchlist, both
by things a list entry doesn't carry and a departed film no longer has in
the dataset. A separate document because the lists load on every page for the
markers, and credits would triple them for data only `/personalise` reads.
Ids are TheMovieDB's, which the dataset's genre and person ids already are.

- **Every add saves them, in the same write as the entry** (a Firestore
  batch in `addToUserList` / `addManyToUserList`): both are saved or
  neither, so no film is listed without its details. `addToList` and
  `importToList` take them as an argument, so a new way of adding a film
  won't compile until it supplies them. Where they come from:
  - a film that's showing: the dataset (`collectFilmDetails`), on its page,
    in the film search and in an import;
  - a departed film: its page's own data, worked out on the server;
  - a TMDB search result, or a film an import found on TMDB: the search
    Worker's details endpoint (`fetchFilmDetailsFromTmdb`), looked up on the
    press, or in a second paced pass before the import's review. If the
    lookup fails, nothing is added.
    A film already listed (Seen it on the watchlist) has its details from its
    first add and may pass none.
- **Films listed before that get theirs from a migration**
  (`scripts/migrate-film-details.js`), run by hand with a service-account
  key that never leaves the machine running it. It dedupes every listed film
  across every user, looks each up on TMDB directly (so the Worker's
  per-reader limit doesn't apply), and replaces each user's document in a
  transaction that re-reads their lists, so a film added meanwhile keeps its
  details. Any lookup that still fails stops it before a single write. It
  reads TMDB as the Worker does, repeated in
  `scripts/lib/film-details-migration.js` since a Node script can't load the
  site's TypeScript: change one, change the other. Safe to run again; a run
  with nothing to change writes nothing.
- **Cast stops at five** (`FILM_DETAILS_CAST_LIMIT`): favourite actors are
  leading roles, and the document has a 1 MiB limit.
- **Unmatched films get no details.** Their genres are only the venue's
  categories or the Uncategorised placeholder; stats should count them as
  "without details", not guess.
- **Ids are checked before TMDB is asked** (`isTmdbId`): under eight digits
  with no leading zero, since an unmatched film's pipeline id is eight hex
  characters and can be all digits.
- **Removing a film leaves its details**, so readers join the document on the
  lists rather than reading it alone.
- **Its fields are exempt from indexing** (`firestore.indexes.json`), since
  every map key and array element counts toward the 40,000 index entries a
  document may have. Deploy rules and indexes with the Firebase CLI before the
  site: without the rule, deleting an account fails on this document.
- **Not your ratings.** Letterboxd's diary carries them, but nothing here
  could change them afterwards, so they would go stale.

**Controls live under the poster on the film's page** (`UserListButtons`),
and under film search results, never on browsing-grid posters. Signed out, the
buttons link to `/personalise`, which makes them the way in to
personalisation. **Marking a film seen takes it off the
watchlist**, in the same write so the two can't disagree; the reverse doesn't
hold, since wanting to see a film again doesn't undo having seen it.

**Grid posters carry markers instead** (`PosterStatusMarkers`, in
`FilmPosterGrid` and `MovieCell`): small discs top-right for each list the film
is on — top-right because the rank chip holds top-left, award emblems
bottom-right, and the title overlay the bottom edge on touch. They cost nothing
extra: `UserProvider` sits in the root layout, so a signed-in reader's lists
are already loaded on every page. Statuses are independent (a film can be seen
and back on the watchlist), so markers stack like chips and fan out on hover;
a new status such as an alert is one more entry in its `MARKERS`. They render
only once signed in with lists loaded, so the static HTML is unchanged.

**The home page opens with "From Your Watchlist"** (`WatchlistRow`,
`getWatchlistRow`), above Showing Across London: watchlist films with a
bookable showing in the next fortnight — a fortnight, as for occasions, since a
watchlist is small and worth planning around. It is **ordered by favourite
venues, not filtered to them**: a handful of venues against a handful of films
usually intersect in nothing, and a one-poster row reads as broken. Films at a
favourite come first, soonest there first, subtitled with the venue and date;
then the rest, with the Last Chance row's "Last showing" when the run is ending
and "Next showing" otherwise. Every category counts, since the reader chose the
films. Hidden when empty and while signed out, so the static HTML is unchanged.

It arrives seconds after paint, above every other row, so its slot **reserves
the height the row last had**: an inline script sets it before paint, only for
a reader carrying the signed-in flag (which is why `SIGNED_IN_FLAG_KEY` lives
in `@/lib/user-lists`, readable from a server component, not in the user
context). The reservation comes off in a layout effect once the row settles,
which also stores the new height — or clears it when the row is empty, so a
reader with nothing showing reserves nothing next time.

**Under it, "From Directors You Love"** (`DirectorsRow`,
`getFavouriteDirectorsRow`): films with a bookable showing in the next
fortnight, the watchlist row's window, by a director the reader has seen two
or more films by (`getFavouriteDirectors`, `FAVOURITE_DIRECTOR_MIN_SEEN`). The
favourites come from the film details document rather than the dataset, since
most films on a Seen list finished their run long ago, and a film counts for a
director who directed it or a film it screens (`getMovieAndIncluded`). Films
already seen are left out, and so are those on the watchlist, which the row
above shows. Unlike that row it keeps to the curated rows' default
categories, being suggestions. Ordered by how many of the director's films
the reader has seen, then soonest; each subtitle names the director, then the
next showing and how many of theirs the reader has seen ("Sun 22 Nov · 4
seen"), joined so they never split and a long name pushes them whole onto a
second line; "Explore their films" opens the catalogue on the row's
directors (`getPeopleFilterUrl`) and switches on "Hide films I've seen" as
it's followed (`PosterRow`'s `onSeeAllClick`), so the grid leaves out what
the row did. That filter is personal and never in a URL, but a followed
link keeps it (`keepPersonalFilters`); it stays on afterwards, as the
standing preference it is. Hidden below three films
(`FAVOURITE_DIRECTORS_ROW_MIN`), while signed out, and when the details can't
be read. It reserves its last height as the watchlist row does
(`getRowReservationScript` and `storeRowHeight` in
`watchlist-row-reservation`, the two sharing the slot's styles), and arrives
later still, needing the details too. The user context reads those once a
session (`readFilmDetails`, cached until an add or import writes new ones),
so the stats and this row share one read.

**`/updates` says what a day did to the watchlist** (`WatchlistHighlights`):
a pink panel under the day's figures, "3 films on your watchlist got new
showings", each film once however many of the day's runs touched it
(`getDayFilms`), with a link to plan them. Every film the day changed ships to
every reader, since only the browser knows the list, so each carries only what
the panel shows. Below it the same films are marked where they appear: the
poster markers on new films (`PosterTile`'s opt-in `movieId`; `/personalise`
leaves it off, every tile there being on a list) and a yellow "On your
watchlist" tag after the title in More showings. Signed-in only and hidden
when nothing matched, so the static HTML is unchanged.

**`/personalise` splits the watchlist into showing now and not showing**,
using the client cinema data, since what's on is the question a watchlist is
brought to. Films not showing are unlinked: whether a departed page still
exists is only known at build time. **Seen is one list**, showing or not:
having seen a film is what matters, and a showing one still reads as such by
being linked. Each group is sorted by normalised title,
as /catalogue and /planner are — the pipeline's `normalizedTitle` for a film
still in the dataset, the same folding applied to the snapshot's title for one
that has left it. Films are `PosterTile`s, as on /updates, so the title reads
under the poster and the Remove button sits beneath it, outside the tile's
link — the pill the film page's list buttons use, pink on hover.

**Long lists open as a stack** (`PosterStack`): Seen, and the watchlist's
Showing now and Not showing, each drawn closed as a pile of posters that is
one button ("Click to expand" on hover, "Tap to expand" on a touch screen,
the count beside it). Opening it flies each poster in the pile to its tile
(measured before and after, animated with `element.animate`, nothing for a
reduced-motion reader) and fades the rest in, while the caption flies to the
top right as a "Hide them" toggle, so it can be closed from where it was
opened. The toggle is lifted out of the flow into the heading's row above the
lane, so the posters' top edge stays put as the stack opens and closes; in the
flow it pushed the list down 38px on opening and pulled it back on closing. A second sits under the list; closing from there scrolls back up to
the pile if it would otherwise be above the screen. **The pile fills its row
at a fixed overlap**: a laptop draws more posters, a phone fewer, rather than
the same posters spread out or crushed together. The caption moves beside the
posters from 720px of row, measured on the stack rather than by a media
query, so the posters it lays out and the room it leaves agree; at 630px a
media query on the window put it beside posters laid out for the full width. The pile is a picture, not links: the button carries the name, and
focus moves to the first tile on opening and back to the button on closing.
A group that fits on one row is drawn as it is, since a pile of three hides
nothing. **Last chance and More than a screening are never stacked**: they
are the news a reader comes for, and a click between them and it would cost
the page its point. Not showing opens from the start when nothing on the list
is showing, so the watchlist never looks empty, and turning on the editing
buttons opens every stack, since a closed one would hide them. Signed in, the page renders in `StandardPageLayout`'s
`afterContent` rather than the 1000px column, which fits only four posters
across, and aligns to the poster columns as `/planner` does. The 24px gutter
stays at every width: at 1240px six columns otherwise fill the window
exactly, and the lanes' 8px bleed scrolled the page sideways.

**The Seen list's stats lead the page** (`SeenStats`, `getSeenStats` in
`@/lib/user-lists/seen-stats`), under the account bar and above the search:
they are what a reader with a long list comes back for, and the lists below
are long. They are read from the film details document, which only this page
loads, again whenever the Seen list's films change: the headline figures in
a `StatsBand` and the records (longest and shortest sit by runtime, oldest
and newest by year with how long ago) as `PosterTile`s, side by side from
1000px with the band two figures to a row (`layout="grid"`): four figures
across and four posters across each left half the row empty. Below that the
band is its usual row of four, with the records centred under it. The records
are their own grid, four across or two by two, never the three-and-one the
tile list's fitted columns gave at some widths. "Show more stats" doesn't
scroll on opening (`ExpandableSection`'s `scrollOnExpand`): the charts open
right beneath it, so centring the trigger only moved the page. Directors,
actors, genres, decades and languages sit behind "Show more stats", as
`RankedBarChart`s (decades with `keepOrder`, in date order) and language
chips, in two columns of about the same height — the short rankings and the
decades in one, the long genre list and the languages in the other — since
side by side in pairs each chart left a gap under the shorter. A line turning the hours into days and double bills was tried and
taken out; it didn't earn its place.

- **Years come from the list entries, everything else from the details**, so
  an unmatched film counts towards the decades and nothing else, and a
  footnote says how many films had nothing to count. Watch dates are never
  shown: an entry's date is when it was added, and an import adds hundreds in
  a day.
- **Newest and oldest tie on the year**, as no release date is stored. Within
  a year the film added most recently is newest (and the one added earliest
  oldest), which usually picks the film just seen over one from earlier that
  year; an import's films, added at once, fall back to the title. Storing
  TMDB's release date with the details would settle it properly.
- **Nothing shows below five films** (`MIN_STATS_FILMS`); a line says how
  many to go. Within the stats, a ranking needs people with two films or
  more, decades need two decades and languages two languages, and a record
  that would repeat the other of its pair (one film both longest and
  shortest) is left out.
- **Signed out, nothing renders**, as the stats are inside the signed-in
  page.

**The watchlist says what's time-sensitive** (`getWatchlistHighlights`), in
two groups above Showing now, each soonest first:

- **Last chance** — the last bookable showing is within the home page's Last
  Chance window. The definition is shared, so a film can't be ending on one
  page and not the other.
- **More than a screening** — an upcoming occasion (a Q&A, a live score). This
  is the home row's scoring with no end date: scored over the whole dataset
  (house style is judged per venue) and then filtered to the watchlist, so
  what the home row wouldn't call rare isn't flagged here either. Sold-out
  occasions are skipped.

A film is in one at most: an ending run is Last chance even with a Q&A on its
last night, since missing the film entirely is the more pressing news. Either
takes it out of Showing now. The why goes in a `PosterTile` `note` — a small box
above Remove, with a label ("Final showing", "Q&A with Mike Leigh") and a
plain day and time ("Tomorrow, 20:30") with the venue on a line of its own,
which truncates rather than wraps so a long name can't make one note taller
than its row. Final
showing is yellow, the colour of the planner's "Last chance" tag, so the two
read as the same warning; occasions keep the pink. It sits
at the foot of the tile rather than among the details, where it pushed that
tile's title out of line with the rest of the row.

The two groups **share a row while they fit**. Each is a flex item whose
basis is the width its own tiles need. When both fit they sit side by side (8
films beside 2 fits a 12-poster width) and split the leftover space equally, so
a lone group fills the row and two equal ones go 50/50. A group too long to
share wraps onto a row of its own. Each has a floor at the width of the longest
heading, since a wrapped heading drops its lane out of line with its
neighbour's, and the lanes stretch so neighbours end on the same line.

**Tiles are the same size in every group.** PosterTileList's tracks stretch to
fill whatever width they're given, so a group taking a share of the row would
size its tiles differently from its neighbour and from Showing now. The groups
instead get fixed tracks at `--tile`, the width a full-width list produces,
computed from the measured row width (`useElementWidth`,
`getFullWidthTileWidth`). The space a group grows into stays empty at the end of
its lane.

**Removing offers an undo in place** (`RemovedPosterTile`). The removal is
written straight away — closing the tab never loses it — and the page holds the
entry locally so its tile keeps its place, with **Undo** where **Remove** was.
Undo writes the entry back as it was (`restoreToList`: original `addedAt`, and
none of `addToList`'s side effects, which for Seen would take the film off the
watchlist). The countdown is a 3s CSS animation whose end is the expiry. It
does **not** pause on hover: the pointer is on Undo the moment the tile
appears, so hover-pausing held it open until the reader moved away. It pauses
on keyboard focus only, because focus is moved to Undo and expiring underneath
it would drop a keyboard reader back to the top of the page.

**The account bar is a toolbar**: "Manage lists" and "Manage account" on the
left, each opening a panel below it (one at a time), and who's signed in with
Sign out on the right. "Manage account" holds the What we store note and Delete
account; signed out, the note is a footnote under the sign-in form instead.

**List tools sit behind "Manage lists"**, collapsed by default, since
everything in them is occasional (`list-management.tsx`).
Editing takes a row of its own first, and import and export pair up below it:

- **Show editing buttons** — off by default, and per visit rather than stored:
  buttons under every poster read as the page's main business. Remove under
  every film, and **Seen it** on the watchlist, since ticking off a film just
  watched is the edit most often wanted there. It moves the film to Seen as
  the film page's button does, and its undo puts both lists back in one write
  (`restoreToList`'s `others`), including an older Seen entry for a rewatch.
  The Seen list gets no "Want to see": the film would stay put, so the press
  would show nothing happening, and a rewatch is rare enough for its page.
- **Import from Letterboxd.** Reads Letterboxd's export files (`watchlist.csv`,
  `watched.csv`, `diary.csv` — `Name`, `Year`, a date) and its import format
  (`Title`, `Year`, `tmdbID`), parsed in `@/lib/user-lists/letterboxd-csv`. The
  reader picks the target list; the file's contents can't tell a watchlist from
  a watched list. Letterboxd's URI is a boxd.it short link with nothing to
  match on, and its own export carries no TMDB id, so films are found by title
  and year in two passes:
  1. **The dataset**, with `createMovieMatcher` (`@/utils/match-movie`), the
     same resolver the film lists use, pulled out of `get-movie-list-movies` so
     the page doesn't bundle every list's entries.
  2. **TheMovieDB, for the rest**, through the search Worker's batch endpoint
     (`lookUpRowsOnTmdb`, `@/lib/user-lists/tmdb-lookup`). Rows are grouped by
     folded title and year first, so a diary's rewatches are one lookup, and a
     row already on the list by title and year isn't looked up just to be
     skipped. Batches of 100 are paced per film to the Worker's per-reader
     limit of 1,200 lookups a minute (after a batch of n, the next waits
     n x 50ms), so a 2,000-film diary takes under 2 minutes. The Worker must
     be deployed with a batch limit at least `MATCH_BATCH_SIZE` before the
     site, or every batch is a 400; the page shows progress and can
     cancel. Matching is strict — a title that matches, or the only result for
     that year — and a film it can't find is listed in the review for the
     reader to search for, never guessed. A 429 is waited out; any other
     failure is retried twice and then **fails the whole import**, since
     counting a film that couldn't be looked up as missing would drop it
     without the reader knowing.

  A review step shows what will be added before anything is written: how many
  are showing (linked to their pages in a new tab, since the review is only
  page state and navigating away would lose it), the rest unlinked, and the
  films TMDB couldn't find. Films already listed keep their entry, and an
  import to Seen takes films off the watchlist, as a single add does — in one
  write (`addManyToUserList`). All of a reader's lists live in one Firestore
  document, so a very large import (several thousand films) could hit its
  1 MiB or 40,000-index-entry limits; excluding the list fields from indexing
  is the fix if anyone does.

- **Import from IMDb.** The same buttons take IMDb's list exports (the
  watchlist to the Watchlist, ratings to Seen), told apart by their `Const`
  column and parsed in `@/lib/user-lists/imdb-csv`. `Const` is the IMDb id, so
  a film that's showing matches exactly, and so does one that isn't: the match
  endpoint takes an `imdbId` and asks TMDB's find endpoint instead of searching.
  A title search as well would be a second TMDB call for a film the Worker
  charges one lookup, so the ids it misses are asked about again by title and year in a second pass
  (`lookUpRowsOnTmdb`). An older Worker ignores `imdbId` and searches the
  title, so the Worker and the site can deploy in either order. A row is dated by `Date Rated`, else `Date Added` or `Created`, the
  first it fills. Series, episodes, games and podcasts (`Title Type`) are left
  out and named in the review. IMDb has no seen list apart from ratings, so a
  film seen but not rated there can't come in. The headers were checked against
  a watchlist and a ratings export from November 2026, and are found by name,
  since the two order them differently and older exports were lower case.
- **Nothing is exported to IMDb**, which has no way to import a list.
- **Export** writes each list in Letterboxd's _import_ format rather than its
  export format: the `tmdbID` column makes it an exact match both in Letterboxd
  and back in here. A pipeline-generated id isn't TheMovieDB's, so it's left
  out and Letterboxd falls back to title and year.

**Any film can be added, showing or not**, from the search in the open
between the account bar and the watchlist (`film-search.tsx`). **Films that
are showing come first**, found as the reader types (`searchShowingFilms`,
matching as the catalogue's search box does, closest first) from the dataset
the page already has: instant, and nothing leaves the browser. Twelve are
drawn, with a link to the catalogue for the rest. **TheMovieDB is the second
step**, on Enter, on "Not showing? Search all films" beside the Showing now
heading, or on a last tile in the results: a poster's footprint in dashes
(as a removed film leaves one) asking "Not seeing it?", the whole card the
button. The tile is where the eye ends having scanned the results and not
found the film, and being shaped like a result it reads as part of the answer;
a line of text under the results, and then a button by the heading, were both
easy to miss. When nothing showing matches, the step is the main button under
the box. **The answer is one grid, not two**: its results join the films
already drawn, after them and without repeating any, and the heading turns
from "Showing now" to "All films", with each showing film marked "Showing
now". Two sections answered the same search twice. The heading's row keeps
its height whether it holds the button, "Searching all films…" or "Showing
now first", so nothing below it moves as the search runs: the button
dropping out of it shifted the grid up. TheMovieDB's results are hidden once
the box says something else, the button offered again. It used to sit in the list tools, because the usual way to add
a film is from its own page and every search cost a Worker request; with what's
showing searched for free, the box costs nothing until the reader asks for
more. The site can't call TMDB itself — the
key would ship to every browser — so the search goes through a Cloudflare
Worker, [clusterflick/api-tmdb-search](https://github.com/clusterflick/api-tmdb-search),
on `clusterflick.com/api/tmdb/*` in front of the static site. It answers only
signed-in readers: `@/lib/tmdb-search` sends the Firebase ID token
(`getIdToken` on the user context), refreshes it and retries once on a 401, and
reports a 429 rather than retrying. The Worker's results already have a list
entry's shape, keyed by TMDB id — the same id a matched film has here — so a
result that is showing is the dataset's film (linked, and added as its page
would add it) and the rest are added from TMDB's snapshot. It never runs as
the reader types: every request counts against the Worker's per-reader rate
limit. TMDB asks for attribution in an About or Credits section, not beside
its results, so the About page's covers this. `next dev` rewrites
`/api/tmdb/*` to the Worker's `wrangler dev` on port 8787; a static export can
have no rewrites, so the build leaves them out.

**The watchlist opens on the grid.** "Explore watchlist" and "Plan watchlist"
beside its heading link to `/catalogue` and `/planner` with the films filter
set to every film on the list (`getMoviesFilterUrl`, with `base=all` so the
default week doesn't hide most of it). See Films Filter in `packages/catalogue/src/filters/CLAUDE.md` for why it carries
films that aren't showing. The helper is imported from its module rather than
the filters barrel, which would bundle the whole engine into this page.

**Venues can be starred into "My Venues"** (`FavouriteVenueButton` in a venue
page's hero), which the filter overlay offers as a Venues pill beside Near Me.
They are kept in a `favouriteVenues` field of the same document, not as a
`UserListId`: those are films, and markers, import, export and the watchlist
links all assume it. Each entry snapshots the venue's name, since a venue can
leave the dataset; like the films filter, a departed venue's id is kept in case
it returns. The pill selects only the favourites the dataset knows, so its
count is what the reader gets and a selection made from it matches it again.
It is hidden while signed out or with none known, and it is checked before the
other presets, so a favourite set that happens to equal one still reads as
My Venues. `/personalise` lists them between the watchlist and Seen as `VenueCard`s, with the
same Remove toggle, and "See on a map" opens the film page's `VenueMapDialog`
over the ones the dataset still knows. Empty, it offers the venue indexes (`/venues`, `/near-me`,
`/london-cinemas`, `/cinema-groups`) as the empty watchlist offers places to
find films.

**Empty lists** (`EmptyList`) sit in the same lane panel the full ones do, each
with its own neon icon (ticket, projector, 3D glasses). The button that fills
a list is named in yellow with the icon it carries on the site
(`ControlName`), so the reader knows it when they see it. The empty
watchlist's "search for a film" scrolls to the film search and focuses it.
The empty My Venues links to `/catalogue#open-filters`, which opens the filter
overlay on arrival (`useOpenFiltersHash`, on /catalogue and /planner) — the My
Venues pill lives there and no page describes it better. The hook must run
before `applyUrlParams`, which replaces the whole address, hash included. The page is client-rendered and can't know which venues it
will show, so its server component passes every logo path in
(`getVenueImagePaths`), as `/near-me` passes its venues.

**AI assistant access** (`assistantAccess`) lets a reader's own assistant search
the listings through api-mcp, a Worker at `mcp.clusterflick.com`
(`@/lib/assistant-access`). It's invitation-only and never advertised: only a
reader with the capability sees its "AI assistant" panel in /personalise's
account bar, beside the public profile's: the address to add and how, beside
the assistants they've connected, each to disconnect
(api-mcp's `/connections`, called with their ID token). Each says what it
can and can't do, from the OAuth scopes it was given (`ASSISTANT_SCOPES`,
which follows api-mcp's `src/scopes.ts`): one connected before a scope was
added, or with the lists unticked, says what it lacks and to reconnect it. The assistant's OAuth sign-in runs on the Worker, which asks the reader to
approve the assistant, then sends them to `/connect/` here to sign in, since
Firebase's sign-in lives on the site. That page posts their ID token to the
Worker's `/callback`, an address fixed at build time and never taken from the
link, with the `state` the Worker sent, checked to be exactly what the Worker
hands out. A sign-in link sent from `/connect/` returns there
(`sendSignInLink`'s `returnTo`), and its `state` survives the sign-in
(`withoutSignInLink` removes only Firebase's parameters). The Worker checks the
capability again on its calls, so revoking it switches the assistant off.

**Capabilities are features granted one account at a time**
(`@/lib/user-capabilities`): `emailAlerts`, `publicProfile` and `assistantAccess` so far, each
in `CAPABILITIES` with its copy, a `Record` so a new one won't compile
without. A capability says a reader _may_ use a feature, and whether they do
is their own setting, so everything acting on one checks both: the alerts job
looks for the capability and then the reader's alerts, the profile Worker for
the capability and then the profile being public. Revoking one switches the
feature off and leaves the reader's settings alone, and being allowed a public
profile never publishes anything by itself.

- **They live in `users/{uid}/meta/capabilities`**, a map of id →
  `{ grantedAt }`. Not in `users/{uid}`: the reader writes that, and its rule
  allows only the list fields, so a capability there would fail every later
  list write. The rules let the reader read and delete it (with their
  account) and never write it; only `npm run grant-capability`, with the
  Admin SDK, does. Its dry run and `--write` follow `migrate-film-details`,
  and it refuses an id the registry doesn't hold (repeated in
  `scripts/lib/capabilities.js`, held to the registry by a test), since the
  site ignores unknown ids and a typo would be a grant that does nothing.
- **Hiding a page is not the guard.** The site is static, so a configuration
  page shown only to a reader with the capability is a convenience. What
  enforces it is the rules on that feature's own writes (a `get()` of the
  capabilities document) and the job or Worker running it, each checking for
  itself.
- **Read on request, once a session** (`readCapabilities` on the user
  context, cached like the film details), as only `/personalise` reads them
  so far. A grant shows on the reader's next visit.
- **While a feature is being built, granting it shows a "Coming soon" panel**
  on `/personalise` under the account bar (`ComingSoon`), naming each granted
  capability with its `comingSoon` copy. Nothing renders without one, or if
  the read fails. When a feature ships, its `comingSoon` becomes `null` and
  the panel gives way to the feature's own settings, as Public profile's has.

**Public profiles** (`@/lib/user-profile`) are a page at `/u/<handle>/`
showing what a reader chooses of their lists, venues and stats, for readers granted
`publicProfile` who switch it on. The site holds the handle, the switch and a
shell page; a Cloudflare Worker, `clusterflick/api-profiles`, serves the
profile.

- **Two documents name each other.** `handles/{handle}` holds `{ uid }`: a
  document id exists once, which makes handles unique, and it is the Worker's
  lookup. `users/{uid}/meta/profile` holds `{ handle, public, sections,
displayName, links, favourites }`, readable by
  its owner only. Every change is one batch over both (`saveProfile`,
  `deleteProfile`), and the rules accept a write only if, after the batch,
  each still names the other: a claim creates both, a rename deletes the old
  handle and creates the new one, and the profile can't be deleted without
  its handle, so no handle is left reserved with nothing behind it. A handle
  is never updated, and anyone signed in may get one (to be told it's taken)
  but nobody may list them.
- **Lowercase everywhere**: the address, the ids and what the page shows. The
  field lowercases as it's typed, so there is one spelling to keep in step.
  The pattern, lengths and reserved list are in `firestore.rules` as well as
  the module, and a test beside the rules tests holds the rules' copy to
  `reserved-handles.json`. The list is short and curated, not a published
  blocklist: handles sit under `/u/`, so they can't collide with a page, and
  what's left is impersonating the site.
- **Claiming, renaming, choosing sections and `public: true` need the
  capability; `public: false` never does**, and without the capability it is
  the only change allowed (`affectedKeys().hasOnly(['public'])`), so a reader
  whose capability was revoked can still take their profile down and nothing
  else. Revoking deletes nothing: the page stops
  being served, the handle stays theirs, and a new grant restores it.
  `/personalise` then shows a notice offering to switch it off, in place of
  the panel.
- **The reader chooses what the page shows** (`sections`: Seen stats,
  watchlist, favourite venues, Seen list, `ProfileSectionId`, repeated in the
  rules and the Worker). Every section starts on, but **a profile can't go
  public until a choice has been saved**: the rules refuse `public: true`
  without `sections`, so publishing is never a step that skips seeing what's
  on the page. A profile made public before sections existed has none and
  shows everything, as it did; it can be switched off as it is, but changing
  anything else means saving a choice first, and the settings say so.
- **With every section switched off, the profile shows the popcorn
  knocked over** (`NothingShared`, `PopcornLogo`'s `spilled`) over "… isn't
  sharing any lists yet", favourites or not, and so does the preview as the
  last switch goes off.
- **A hidden section is never sent, not just not drawn.** The Worker builds
  its field mask from `sections`, so a hidden list never leaves Firestore,
  and sends the page `sections` to tell a hidden list from an empty one
  (`getShownSections`; none from an older Worker means everything). The
  stats are the exception the settings explain: they are worked out in the
  visitor's browser from the Seen list, so showing them sends the list even
  while it is hidden, and their records name a few films. **Deploy the Worker
  before the rules and the site**: the other way round, a reader could hide a
  section that the old Worker still sends.
- **A name and links are optional** (`@/lib/user-profile/identity`): a
  display name heads the page in place of the handle, which leads the line
  under it and the Worker's title ("Siobhán O'Brien (@film-fan)"), so the
  address is never hidden behind a name anyone could choose. Links are film
  ones only: Letterboxd, IMDb and a website. They are stored as identifiers
  (a Letterboxd username, an IMDb user id: `ur` and digits for older
  accounts, `p.` and lowercase letters and digits for newer ones) and the
  page builds the addresses, so only the website is an address a reader
  typed, and it must be https. All open in a new tab with
  `rel="me ugc nofollow"`, each button carrying its mark: the Letterboxd
  dots and a globe for the website; IMDb's mark is its name in a badge, so
  its button is its name alone.
- **A name is stripped, not escaped.** It is written into the page's
  `<head>` and into Next's inline payload, as a JSON string inside a
  JavaScript string, so `FORBIDDEN_NAME_RANGES` (`"` `&` `<` `>` `\`,
  control characters, the line and paragraph separators, and the
  bidirectional overrides and isolates) are dropped as it's typed, refused by
  the rules, and stripped again wherever it's read: by the Worker, and by the
  page. A leading `$` goes too, since the payload reads a string starting
  with `$` as a reference. An apostrophe stays (O'Brien): nothing it's
  written into is quoted with one. The lists and patterns are repeated in
  `firestore.rules` (held to the module by `rules-copy.test.ts`) and in the
  Worker: change all three together. Letterboxd usernames are letters,
  numbers and underscores (no hyphens); their length limit isn't published,
  so 50 is a generous cap rather than Letterboxd's own.
- **Up to four favourite films head the page** (`@/lib/user-profile/favourites`),
  in the reader's order, as Letterboxd's Four Favourites do. Each is its
  own snapshot (id, title, year, poster) in the profile document, **not a
  reference into the Seen list**: tidying Seen shouldn't undo a statement
  made once, a hidden Seen list stays wholly hidden rather than hidden but
  for four films pulled out of it, and a reader with no Seen list can still
  pick. They're picked from the Seen list as the reader types, then from
  TheMovieDB on "Search all films", the film search's two steps
  (`favourites-picker.tsx`), into four places that can be dragged into
  order, or moved with their arrows from the keyboard; an empty place opens
  the search. A result is picked by pressing its whole tile (`PosterTile`'s
  `onClick`, with an "Add" `cue` over the poster on hover), which clears the
  search and puts focus back in it for the next.
  There's no section switch: picking none hides them. The count
  and patterns are repeated in the rules (held to the module by a test) and
  the Worker.
- **A link to a profile previews with its first favourite's poster**, set
  by the Worker in place of the site's image (a `summary` card, the poster
  beside the text). Only ever TMDB's image, so nothing a reader uploads is
  shown under the site's name; a card drawn in the browser and stored per
  reader was considered and left for later for that reason.
- **The hero is the favourites** (`ProfileHero`, shared by the page and the
  preview): fanned like a hand of cards over a blurred wash of their
  posters, as the home page's carousel washes its poster, so each profile
  looks like its owner. A favourite that's showing links to its page. Under
  the name, a line of the reader's taste (`getTasteLine`: "Mostly drama ·
  Big on the 2000s · 2 Wong Kar-wai films"), from the stats the page already
  shows and only with them, each part only where it's true enough to say.
  The owner gets Edit profile and Copy link in the top right corner, out of
  the flow, since they arrive once the owner is recognised and aren't part
  of the profile; below 1100px the hero keeps a strip above the fan for
  them, for everyone, so nothing moves when they appear. **Nothing in the
  hero waits on anything**: the posters are the favourites' snapshots (the
  dataset's only where a snapshot has none), and each blurred poster's layer
  is a fixed height from the hero's top rather than the hero's height, which
  rescaled them as the hero's lines arrived. The wash stays clipped to the
  hero: run on past its foot, it painted over the heading below.
- **A profile is useful to a friend, not just a record.** On someone's
  profile the watchlist leads with how many of its films are showing this
  week, linking to the planner on just those (`getShowingThisWeek`), and its
  buttons speak of them ("Plan from Siobhán's watchlist").
- **A visitor is offered what they have in common with the owner**
  (`ProfileComparison`, `compareProfileLists`), not shown it: they came to
  see the owner, so the top of the page is a small card, not the overlap.
  Signed in, it says how many films they share and offers Compare, which
  swaps it for the films in groups (both want to see, with "Plan together"
  opening the planner on those with a showing to book; both seen; each
  one's films the other has seen), each a `PosterStack` as the watchlist's
  groups are, sharing a row while short; Hide brings the card back. Signed
  out, the card invites them to start lists of their own. Either can be
  dismissed for the rest of the day, so it's out of the way for the visit
  without being gone for good: the sign-up card for every profile, the
  compare card for that profile only (`comparison-dismissals.ts`). Dismissals live in
  `localStorage`, being a preference about the page rather than anything
  about the reader's lists, so the account-only rule doesn't apply. It's
  worked out in the visitor's browser from their own lists against what
  the profile sends, so nothing new leaves anyone's account, and **only
  lists the owner shows are compared**: the Seen list arrives for the stats
  while hidden, but "you've both seen" would name films from it, so Seen is
  compared only when the list itself is shown. Never for the owner, nor
  when the profile shows neither list.
- **The settings are their own page, `/personalise/profile/`**, and one
  draft (`@/lib/user-profile/draft`): where the profile stands and the way
  to publish it, then the address, name and links, favourite films and
  what it shows, unnumbered, since a reader coming back is editing rather
  than setting up. Everything is saved with **one Save in a bar stuck to the
  bottom of the screen**, a new handle included, so nothing has to be saved
  before anything else; it says what stops a save, asks before a rename
  frees the old address, and leaving with changes unsaved asks first. The
  handle is checked as it's typed (`useHandleAvailability`), and again on
  saving, since another reader can claim it in between.
- **The preview sits beside the settings** from 1100px, sticky and
  scrolling on its own, and on a narrower screen is a full-screen dialog
  opened from the save bar (and isn't drawn until then). It draws from the
  draft, saved or not, through the profile page's own `ProfileHero` and
  `ProfileView`, so the two can't differ. **Beside the settings it's an
  iframe** (`PreviewFrame`): about 750px of a wide screen, drawn in the page
  it took the profile's desktop layout and was cramped. The frame is still
  this page's React tree, through a portal, so it keeps the reader's lists
  and the listings; the page's stylesheets are copied in and kept in step,
  with `<html>`'s and `<body>`'s classes and style, which carry the fonts.
  Script that asks a window a question goes through `ViewWindowProvider`:
  `useMediaQuery` asks the frame's, and `useElementWidth` and `PosterStack`
  use their element's own window.
- **Addresses are written without the trailing slash**
  (`getProfileDisplayAddress`: `clusterflick.com/u/film-fan`); links and
  copied addresses keep it, being where the page lives.
- **Publishing is one press, and a moment.** The switches and the preview
  beside them are where the reader considers what's shared, and making it
  private again is one press too, so a confirmation step listing the
  sections was taken out. "Publish profile" saves the draft and
  `public: true` in one write, so what goes public is what the preview
  showed, and with unsaved changes it reads "Save and publish" to say so.
  Only a new address in the draft asks first, since freeing the old one
  can't be undone. While something stops it (no handle yet, one that's
  taken), that reason stands where the button would be. The card then flickers on like a neon sign, once,
  with the address, Copy link and the phone's share sheet where there is
  one. A `ReleaseDot` says where it stands, here and in the account bar's
  panel: green and pulsing while public, still pink while private. A
  private profile offers no link to itself, since the owner would find only
  a page saying it's private; the preview is how it looks. The account bar's "Public profile" panel (`public-profile.tsx`)
  only says where the profile stands and links here. A refused batch is
  reported as "taken" when the handle changed, since another reader
  claiming it between the check and the save is the likely cause, and
  logged in case it isn't. `readProfile` reads it once a session, as
  `readCapabilities` does.
- **The page is `/profile-shell/`, filled in by the Worker.** The export has
  no page per reader, so the Worker owns `/u/*`: it reads the profile from
  Firestore as a service account (nothing there is public), fetches this
  page, and puts the profile in a `<script id="profile-data">`. It decodes
  the lists, favourite venues and film details into the site's own shapes
  (`UserLists`, `FavouriteVenues`, `FilmDetailsData`), keeping only the films'
  details the Seen stats read, and the page checks them again with the same
  rules (`@/lib/user-profile/page-data`, mirrored by the Worker's
  `src/lists.ts`: change them together). The page is
  `/personalise` read only, with only the sections shown (`ProfileView`):
  the same `SeenStats`, `UserListSection` and
  `FavouriteVenuesSection`, with `publicView` (and `SeenStats`' `details`)
  keeping the editing away and speaking about the reader rather than to them.
  A change to those sections shows on profiles too. Unknown, private
  and revoked profiles are one not-found response, so they look alike to
  everyone but the owner, recognised by their own profile document (only
  they can read it), who is told theirs is private. Each profile is cached
  in a Durable Object for five minutes and purged by every write
  (`commitUserWrite`, above), so a change shows on the next view. The
  Worker's README has the routes, what it sends and how the cache works.
- **The shell's `<head>` is the Worker's to set.** Next renders the `<head>`
  again in the browser from the page's inline RSC payload, so whatever the
  shell's metadata says comes back after hydration. So it has no `robots` or
  canonical (the Worker adds them: `noindex` when not found, `index, follow`
  and `/u/<handle>/` for a public profile), and its title and description
  are the fixed strings `PROFILE_SHELL_TITLE` and `PROFILE_SHELL_DESCRIPTION`,
  which the Worker replaces in the `<head>` and the payload alike: keep them
  plain text, and change them in both repos together. `/profile-shell/`
  itself is kept from crawlers by `robots.txt` and left out of the sitemap.
  Links to a profile are plain anchors (`ButtonAnchor`), never `next/link`:
  the export has no such route to navigate to. `next dev` sends `/u/*` to the
  Worker's `wrangler dev` on port 8788.
- **The rules are tested against the emulator** (`firestore-rules/`,
  `npm run test:rules`, and a CI job of its own), through Firestore Lite with
  the module's own helpers, so the tests send the batches the site sends.
  Change the rules, run them. Deploy the rules before the site, since the
  site's writes fail until they're live.

**Personalisation is account-only**, lists and venues alike, so that it syncs
across devices. Don't add a signed-out, browser-held copy of any of it.

**Deleting an account deletes the lists first**, film details, profile and
capabilities included (a subcollection isn't deleted with its parent): once the account is gone, the
rules let nobody delete its documents. Firebase may refuse the account deletion
without a recent sign-in; the lists are gone by then and the page says how to
finish.

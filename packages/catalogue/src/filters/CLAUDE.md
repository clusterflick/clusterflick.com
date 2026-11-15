# Filters

How the filter modules and the engines around them behave. The overlay that presents them is documented in `src/components/filter-overlay/CLAUDE.md`.

## Cast & Crew Filters

Directors and cast are **filters on the films grid, not pages of their own**
(`packages/catalogue/src/filters/modules/people.ts`, surfaced in the filter overlay's
`PeopleFilterSection`).

**Why no `/directors/<id>` pages.** Measured against a live release: 1,288
distinct directors, of whom **1,082 (84%) have exactly one film showing**. A page
each would be ~1,300 static pages that mostly reproduce a TMDB synopsis already
on the film's own page — thin content, and a meaningful share of a build that
already runs 20 minutes for ~3,600 pages. It is also the call `/lists` already
documents: "a threshold slid along a continuum is a filter, not a list", and
"directors with enough films on" re-cuts itself every week. The stale-page
problem that films need (`departed-movies.json`) therefore never arises here —
there is no page to 404.

**The data is already shipped.** `people` is 449KB of the 645KB meta blob every
visitor downloads, and `movie.directors` / `movie.actors` are already in the
chunks. Before these filters that payload existed only to render name pills. The
filters cost no additional bytes.

**`people` carries no role** — it is a flat `{ id, name }` map covering
directors and cast alike. `getPeopleVocabulary` folds `movie.directors` and
`movie.actors` to split them, and the fold doubles as the per-name film count.
Memoise it on the dataset; it is one pass over every film's credits.

**Empty means unfiltered, unlike genres.** Both store `string[] | null`, but
genres are an enumerated chip list where `[]` legitimately means "none selected,
nothing matches". People are a typeahead with no Select All, so `[]` is just what
removing the last name leaves behind — it is treated as no filter, and
`fromUrlParams` normalises it to `null` so an empty `?directors=` can never
report itself restrictive while filtering nothing.

**Names link from movie pages** (`CastCrewSection` → `getPersonFilterUrl`), which
is the only thing making the filters discoverable — nobody opens an overlay
looking for a filter they don't know exists. Links carry `base=all`, since the
today→+7d default would answer a director with one film three weeks out by
showing nothing.

**It is the "Directors & cast" Refine row** (see `src/components/filter-overlay/CLAUDE.md`), as two
`advancedFilterGroup`s in one row — cast and crew are one way to narrow an
event, not two. Those groups space their
own children, so `EntityQuickAdd` carries no margin of its own and each placing
section supplies it (`standaloneQuickAdd` for the venue one, which sits in a
section with no gap). Two CSS modules cannot override one another by class
order, so the margin has to live at one end or the other, not both.

**The row opens itself while a director or cast member is set**, as every
Refine row does: these arrive from outside the overlay (a name on a film
page), and behind a closed row they would read as no filter at all.

**The control is `EntityQuickAdd`**, the Downshift combobox the venue filter
already used, generalised. Matching is a substring of both sides run through
`normalizeForSearch`, so case, accents, punctuation and spacing never stop a
match: compared as typed, "Kings Cr" missed "King's Cross St. Pancras" and only
reached it at the lengths the fuzzy pass below happened to cover. The
normalized names are cached in a `WeakMap` on the list. Results stop at
`maxResults` **in list order** — so the vocabulary must arrive
best-represented first, or a two-letter query walks all 11,000 cast names.

**A menu falls back to fuzzy; it has nothing to disambiguate.** When the
substring pass finds nothing the query is re-read as a misspelling ("Mark
Hammill" is one letter from a real name and used to answer with an empty menu),
and the closest names are listed closest-first. Unlike the suggestion engine
there is no tier logic here: a menu _is_ a list of candidates, so several
matches is the normal outcome rather than a problem. Only on zero substring
matches, so the scan never runs while a normal search is being typed, and the
word-splitting is cached in a `WeakMap` on the list rather than done on mount —
most sessions never mistype anything.

**`buildPeopleIndex` is not optional at this size.** It maps every whole-word
run of every name to the people claiming it, keyed the way `normalizeForSearch`
renders a query — safe because `normalizeToWords(s).join("") ===
normalizeForSearch(s)`, so a lookup is exactly the whole-word-run comparison it
replaces. Scanning the names instead cost ~10ms of every suggestion pass once
cast was included (29ms → 39ms), paid whether or not anything matched, on the
deferred path that exists to keep typing responsive. Build it once per dataset
and memoise it beside the vocabulary.

**Popularity is a tie-break and nothing more.** `combine` publishes TheMovieDB's
`popularity` with each person and `rankPeoplePopularity` in
`scripts/process-combined-data.js` replaces it with a 0–99 percentile rank
before it reaches the client. A percentile rather than a rounded score because
popularity is heavily skewed — rounding puts almost everyone at 0 or 1, and the
ties this exists to break are mostly between two people at the obscure end. The
float would cost 274KB across the meta blob every visitor downloads; the rank
costs 91KB.

The underlying score is a rolling _trending_ measure recomputed daily from page
views, not standing, so it must never rank anything on its own — it only orders
two people a query could equally have named. `common/get-movie-data.js` uses it
the same way, behind an exact name match and the person's department.

**Every reader must cope without it.** A release published before the pipeline
started emitting it carries none, and TheMovieDB has no score for some people.
Absent is not zero — unranked, not unpopular — and the ordering falls through to
director-first.

## Films Filter

`FilterId.Movies` (`packages/catalogue/src/filters/modules/movies.ts`) restricts the grid to a
chosen set of films by id. It is the people filters over again, keyed on the
film rather than a credit: `string[] | null`, "or" across the selection, empty
meaning no filter, a `?movies=` param, and an `EntityQuickAdd` in the "Films" Refine row (`MovieFilterSection`). Its main job is the watchlist
links on `/personalise`; the typeahead is for picking a few films to fit
around each other in the planner.

**The selection is a snapshot, and unknown ids are kept.** "Explore watchlist"
and "Plan watchlist" write every id on the list into the URL, not just the
films showing now. A link can be bookmarked or shared, and it outlives the
release it was made against — a film that has finished its run can come back,
and dropping its id would make the link quietly miss it when it does. So
nothing prunes the selection: not `fromUrlParams`, not sanitising session
storage. An unknown id matches nothing until its film returns. What the link
does _not_ follow is the list itself: films added after it was made aren't in
it, which is accepted — the button always builds a fresh one.

**Only what the dataset resolves is counted or named.** The overlay draws chips
for the films it can find and says "Plus 3 films not currently showing" for the
rest; `describeFilters` reads "from 12 selected films", or names up to two. It
takes the loaded dataset as its `movies` lookup, withheld until loading has
finished, so a selection isn't described as not showing while its films are
still arriving. Past six chips the selection collapses to a count, since a
watchlist would otherwise push every other filter off the screen.

**The overlay can select the watchlist too.** A "My Watchlist" chip sits above
the Films row's search for a signed-in reader with anything on the list, and
selects the same snapshot "Explore watchlist" does (`selectMovies`). Before it,
watchlist films at My Venues meant leaving for `/personalise` and coming back
through its link. The chip reads as checked while the selection is exactly the
watchlist; its count is the films on it that are showing.

It widens as "All films", beside the people: a selection left over from
another page is exactly the invisible blocker the empty state exists to name.

## Hide Seen Films

`FilterId.HideSeen` (`packages/catalogue/src/filters/modules/hide-seen.ts`) takes the films on
the reader's Seen list off the grid. It is a "Hide films I've seen" switch at
the top of the filter overlay's core column, above Dates, shown only once a
signed-in reader's lists have loaded. It used to sit under the event types,
below everything, where it was easy to miss; a standing preference leads the
filters rather than belonging to any one of them.

**The state holds the ids, not a flag.** The pipeline is a pure function of the
dataset and the state, and it runs where the user context can't reach —
suggestion probes, the thin-result notice, the overlay's counts — so the Seen
ids ride in the state as `string[] | null`. A flag would also leave everything
memoised on the state blind to a film being marked seen. `SeenFilterSync`
(`src/state/seen-filter-sync.tsx`, rendered inside `UserProvider`, which is
nested in `FilterConfigProvider` so neither can read the other) keeps the ids
equal to the Seen list while it is on, and switches it off on sign out.

**It is personal** (`personal: true` on the module): never written to a URL,
since a shared link is for someone with a different list, and carried across
whole-state replacements that stand for a search — a followed link, a quick
filter — by `keepPersonalFilters`. Reset Filters still clears it.

**Film pages ignore it.** Opening a film you've seen means you came for it;
hiding every showing would answer with nothing. The page applies the filters
with `hideSeen` nulled and puts the reader's setting back on any suggestion it
applies. Suggestions on the grid widen it after every subject and before
accessibility — it is a standing preference, not part of the search.

## Film Club & Festival Filters

`FilterId.FilmClubs` and `FilterId.Festivals` (`packages/catalogue/src/filters/modules/programmes.ts`) restrict
the grid to the showings of chosen clubs or festivals. They are how a club's programme reaches the
catalogue and planner, which otherwise had no way to express a set of OR'd matchers.

**The selection is registry ids, not film ids.** Each id's matchers are run when the filter is
applied, so a link follows the club as the listings change — next month's screenings appear with
no change to the link. A button selecting the club's current films would go stale the day after it
was made. Otherwise it is the films filter over again: `string[] | null`, "or" within the
selection, empty meaning no filter, duplicates dropped by `fromUrlParams`, and ids the registry no
longer holds kept (a festival leaving between editions is a film finishing its run) and matching
nothing meanwhile. `describeFilters` names only what the registry holds.

**Two filters, not one**, built from one factory as directors and cast are. A club recurs with no
end and a festival is a bounded event, and the rest of the site keeps them apart. As with the
people filters, a selection within one is "or" and the two together are "and" — a club's
screenings that are part of a festival.

**Matchers run through the pipeline itself**, over `getPermissiveState()`, so a club's filter means
exactly what its page shows. That makes the manager both the thing running the matchers and the
owner of the modules that call it, so `createMatchAny` takes the pipeline as an argument and the
two modules are built in `manager.ts` — importing the manager from a module would be a cycle.
Unlike `applyMatchers`, `matchAny` prunes nothing by time: inside the grid, finished showings are
the reader's hide-finished setting.

**They run first, and everything is memoised by record identity.** The grid re-runs the pipeline
on every keystroke, and the suggestion engine probes it dozens of times. Running first means they
always receive the dataset itself, which `matchAny` caches on; each filter also caches its union
per input record and (sorted) selection, so the festival filter, which receives the club filter's
output, sees the same record every pass and hits its own cache.

**Suggestions widen them last among the subjects**, after films: a club or festival is usually why
the reader is looking, and a monthly club outside the date window wants the dates widened, not
the club dropped.

**The registries ship to the client**, since the pipeline is synchronous and runs everywhere the
filter state does. Minified and gzipped they are ~4.5KB together; the blurb components stay
server-side.

**Where it surfaces:**

- **Club and festival pages** carry "Explore in the catalogue" and "Plan in the planner" under the
  hero title (`EventDetailPageContent`'s `browseLinks`), and point the grid's explore link at the
  filtered catalogue — as genre and format pages do. Both only while something is showing; a hero
  button onto an empty grid reads as broken. Links use `getProgrammeFilterUrl`, with `base=all` —
  clubs are often listed as events, which the default categories hide, and a monthly club shows
  nothing in most weeks' default window.
- **The overlay**, in the "Clubs & festivals" Refine row (`ProgrammeFilterSection`), one
  `EntityQuickAdd` per group. The row opens itself while either is set, as every Refine row does.

**No banner above the grid.** One was built and taken out: the trigger's description already names
the club ("Events from Japanese Film Club"), and the watchlist and people filters — also set from
another page, also deciding what the grid is about — have none. A banner for programmes alone would
be inconsistent. On a phone the description is what has to carry it, so there it fills the space
between the logo and the hamburger and runs to two lines at 14px — still inside the 40px trigger,
so the header keeps its height and the sticky bar under it doesn't move. One line at the old width
read "Events fro…" at 360px.

**The typeahead carries no counts.** Counting a programme means running its matchers over the
dataset, and each matcher pass is 3–6ms whatever the matcher: against a live release (2,193 films,
36,163 performances) counting all ~90 clubs and festivals took 1.4s, 1s with the search variants
already cached — far too long for opening an overlay, on a phone several times longer. The names
are listed alphabetically instead, and only the selected chips are counted, from the cache the
filter itself has just filled. `EntityQuickAdd`'s `count` is optional for this.

## Occasions Filter

`FilterId.Occasions` (`packages/catalogue/src/filters/modules/occasions.ts`) is the accessibility filter over
`performance.occasions`: one pill per kind the pipeline publishes (`OccasionType`) plus None for
ordinary screenings, nine in all, in the "Occasions" Refine row after Format. `null` is no filter,
`[]` matches nothing, a `?occasions=` param. **The kinds aren't grouped**: in conversation, panel
and guest appearance stay three pills, so a reader is told how many of each there are rather than
a total of things we decided were alike. `OccasionType` and `MoviePerformanceOccasions` are held to
the same keys by a type in `packages/catalogue/src/types.ts`, so a kind added to one won't compile without the other.

**It widens like a format, not like accessibility.** An occasion is a preference about the night,
as 35mm is, so the suggestion engine widens it beside the formats and may pair it; accessibility is
a requirement, widened last and alone. Its words (`OCCASION_ALIASES`) feed the overlay's search
menu and the filter-value offers, so "introduction" finds Intro — the pills keep the tags' short
labels, and the long forms are how people ask.

**Every kind counts, not just the rare ones**, as on the performance tags: it is a fact about one
showing. Rarity belongs to the home row (`findOccasions`).

## Thin-Result Notice

When a filtered grid returns a handful of films and widening the dates would
return meaningfully more, `getHiddenByDate` (`packages/catalogue/src/filters/hidden-by-date.ts`)
says so in a quiet line under the grid, rendered by `HiddenResultsNotice`.

**Separate from the suggestion engine on purpose.** That exists to rescue a
search that returned nothing and is phrased that way throughout; this is the
opposite situation — the search worked, and the answer is merely narrower than
it looks. It is one probe rather than a pass, offers one widening rather than
ranking many, and reads as a fact rather than a rescue. An empty grid returns
null and belongs to the engine, which can pair the date with whatever else is
wrong where this only knows dates.

**Dates only.** The date window is the documented most-common invisible blocker
and the only one with a natural reading ("more showing later"). Anything else
would be a suggestion, which is the engine's job.

**`THIN_RESULT_LIMIT` is 3, and it almost never binds.** Across every person
filter in a live release, 71% show nothing at all, 27% show exactly one film and
under 1% show more than three; raising the limit to five moves the fire rate
from 20% to 21%. What it does do is keep the line off a grid that is genuinely
full — an unfiltered `/catalogue` shows 448 films with 1,382 more beyond the window.

**A film already on screen is never counted as hidden**, however many of its
showings fall outside the window: the reader can see it and click through.

**Shaped like a suggestion offer** — command, then the fact, then the count it
yields — because it is the same kind of thing to press. Quieter for the reason
above: no accent border, no list around it. It follows the same fortnight rule
for dates ("next in 9 days" inside it, "next on Sunday 27 December" beyond), via
`RELATIVE_DAY_LIMIT` in `format-date.ts`, which both this and the suggestion
engine now read.

**It needs a lead-in, for the same reason the empty state has a heading.** A
button on its own under a grid that looks finished has nothing saying why it is
there. "Expecting more results?" is a question rather than a heading, because
the films above it are a real answer and this only asks whether a longer one was
expected — a heading would announce a section and claim more of the page than
the notice is worth.

It probes the live filter state, not the deferred copy the suggestions use: it
is a single pass rather than thirty-odd probes, and a stale count under a grid
that has already moved on would be wrong rather than merely late.

## Zero-Result Suggestions

When a filtered grid comes up empty, `packages/catalogue/src/filters/suggest.ts` finds the cheapest
changes that would return something, each with a real result count, rendered by
`FilterSuggestions` inside the `EmptyState`.

It works by **probing**: build a candidate state, run the real filter pipeline over it,
count what survives. The counts shown are therefore the counts the user will get — there is
no second implementation of the filter logic to drift out of sync.

**Five kinds of move:**

- **Filter value** — the query names a filter value rather than a film: "70mm" is a source
  format, "Action" is a genre. Keeps every word typed, so it ranks above everything. Matching
  is against **whole words, with folded endings and aliases** — never an edit budget. The
  words people actually type for a value are mostly not spellings of its label: "subs",
  "captioned" and "SDH" all mean Subtitles and no distance reaches any of them, so they are
  aliases (`ACCESSIBILITY_ALIASES`, `GENRE_ALIASES`, `CATEGORY_ALIASES` in `value-aliases.ts`,
  shared with the filter overlay's search menu).
  `foldSuffix` strips -s/-es/-ies/-ed from both sides, which covers "subtitle", "subtitled"
  and "dramas" without an entry. Matching a _run_ of words is what lets "70mm" find both
  "70mm" and "IMAX 70mm"; both are offered, each with its own probed count. Vocabularies are the format groups,
  genres, event types, accessibility features and **directors**. **Venues are deliberately
  excluded** — their names are full of ordinary words (Rio, Castle, Everyman) that collide
  with film titles. Genre metadata is keyed by id and the entries carry only a `name`, as
  `describeFilters` reads them. Unlike a correction this is _not_ gated on the query matching
  no title.

  **The same reading is offered on a grid that has results** (`getFilterValueOffers`),
  because the engine above only runs on an empty one and "horror" or "16mm" usually appears
  in a title or two. It is shown _above_ the grid — it is not limited to short grids, and
  under a long one nobody would reach it. The exception is when the thin-result notice is
  showing: the grid is then three films at most, so the offer sits beneath it, just above
  that notice. Either way it only appears when taking it returns more films than
  the grid already shows. A value already selected, and a format's default (Digital, Normal,
  2D), are never offered. People are left out: a name rarely matches a title, so the empty
  path already catches it.

  **People are resolved jointly, not as two vocabularies** (`resolvePeopleQuery`
  in `lib/filters/modules/people.ts`). A name is a far weaker signal than a
  format string: most of a people vocabulary is forenames held in common, so a
  fragment is read as a name only when it picks out one person per role.
  1. Unique in one role, ambiguous or absent in the other → that one. Measured
     502 fragments to 20 in the "unique director, ambiguous cast" direction,
     which is the point — unique among 1,288 directors is a far stronger claim
     than unique among 11,070 cast.
  2. Unique in both, names differ → **both**. They are two different people and
     only the reader knows which. Preferring the director was measured and is
     wrong 23 times in 212, on exactly the names people type: "pacino" is Al
     Pacino (6 films) far more often than Julie Pacino (1).
  3. Unique in both, names match → both, being one person in two roles answering
     for different films. Compared **by name, not id**: TheMovieDB carries
     duplicate person records, so John Carpenter directing and John Carpenter
     appearing can be two ids, and a reader cannot tell two identical names
     apart anyway.
  4. Ambiguous in both → nothing. "john" is 27 directors; a fragment naming 27
     people names none of them.

  **A miss falls through to fuzzy, and the tiers then read it unchanged.** When
  the exact index lookup finds nothing, `fuzzyMatch` returns everyone at the
  _closest_ edit distance and only them, and the four tiers above apply as
  written — one name is that person, two are two candidates, a crowd is nobody.
  Keeping the whole edit budget instead would hand them an average of seven
  names; the closest tier holds exactly one 42% of the time, and where it does,
  it is the right person **98%** of the time. Exact always wins first, so a
  correctly spelt name is never re-read as a near-miss of a different one, and
  fuzzy can only add offers where there were none.

  This is deliberately _not_ a "did you mean" correction like the title one
  below. The offer already names the person and carries a count, so there is
  nothing to ask: "hammill" simply offers **Show films starring Mark Hamill**.

  **Ordering within a pair**: films currently showing, then popularity, then
  director. Film count leads because it is what the offer accounts for — a
  twelve-film retrospective is the better answer to an ambiguous surname.
  Popularity settles the rest, which is most of them: of 212 pairs the counts
  are equal in 165. Director breaks what remains. This is not a breach of "order
  is editorial, never by count" below: that rule stops count overriding whether
  an offer is _actionable_ across kinds of move, and here both offers are the
  same kind and equally actionable — the only question is which person was
  meant.

  **A pair is never split.** The round-one cut gives way by one rather than take
  the first and drop the second, which would present a guess as the answer. It
  can only overflow by one, since a pair is two moves. Nothing else can push a
  pair to the boundary today: measured, **zero** of the 212 tier-2 and 259
  tier-3 fragments collide with the format, genre, event-type or accessibility
  vocabularies. The guard is for when that stops being true.

  A credit floor was tried first and was the wrong guard on every measured axis:
  at two credits it ruled out 1,082 of 1,288 directors — exactly the single-film
  ones with no other route to their film — and still left 46 contested
  fragments. Uniqueness reaches 1,285 and leaves none. The cost argument for a
  floor did not survive measurement either: the scan is ~0.3ms against a ~26ms
  pass, because the probes dominate.

- **Redirect** — the same query matched against a different search field (`Search` ↔
  `ShowingTitleSearch` ↔ `PerformanceNotesSearch`). Concedes nothing, so it outranks
  everything else. Only offered when the target field is empty. `ShowingUrlSearch` is
  excluded — internal-only, so it can neither be explained nor undone.
- **Clear a stale query** — when the film title box and the original venue title or
  performance note box are both filled, clearing the other box (the title query is kept).
  Every text field narrows independently, and the second one is usually left over — typed
  earlier, or put there by a redirect offer — when the reader goes back to search by title.
  No redirect can help, since the query has nowhere empty to go. It leads its offer (the
  reader must agree to losing words they typed) and names the films it brings back; ranks
  after corrections, before widens. The one place the grid drops a query rather than
  redirecting it.
- **Correct** — a near-miss film title replacing the query ("Did you mean …?"). Ranks below
  a redirect, because it rewrites what the reader asked for. Generated only when _no_ title
  matches the query, tested via `matchesSearchQuery` so a query that lands only through a
  spelling variant ("godfather part 2") still counts as correct. Only the main `Search` box
  is corrected: it is the only field drawn from a fixed vocabulary of titles.

  Matching compares the query against **runs of whole words** (`normalizeToWords`), scored by
  an optimal-string-alignment distance that treats an adjacent swap as one edit. Both halves
  are load-bearing and were learned the hard way:
  - _Word anchoring._ `normalizeForSearch` strips spaces, so a free-floating substring match
    scored "ornage" one edit from "short**s for age**s" — three words deep — and beat
    "A Clockwork Orange". People mistype words, not character windows.
  - _Transpositions._ Plain Levenshtein charges an adjacent swap as two substitutions, which
    priced "ornage"→"orange" and "bilss"→"bliss" out of any budget a short query can afford.

  `MIN_FUZZY_LENGTH` (in `word-distance.ts`, shared with the people lookup) is empirical,
  and 5 is a floor _and_ a ceiling: real cases
  ("akera"→Akira, "bilss"→Bliss) are five characters, so raising it loses them. Five-character
  queries stay speculative by nature — anything one edit from a title word draws an offer —
  which is why offers are phrased as a question and carry a count. Re-measure on live data
  before changing either the length floor or the budget formula.

- **Widen** — one filter reset to its permissive value, ordered by elasticity in
  `WIDENABLE`.

**Two moves that write the same filter are never combined.** Each move declares `writes`, and
a pair whose sets intersect is rejected. Transforms apply in order, so the second silently
undoes the first while both still appear in the copy — setting the event type to Quizzes and
then widening the event type to everything produced an offer headed "Show Quizzes" that
selected all events. This also covers the query fields, so a correction never pairs with a
redirect and a query never lands in two boxes at once.

**Candidates come from `getRestrictiveFilterIds`, not `getActiveFilterIds`.** Categories, the
date range and hide-finished have _restrictive_ defaults (Films/Multiple/Shorts, today→+7d,
finished showings hidden), so they report themselves inactive while still removing results — and
they are the most common invisible blockers. Anything comparing against defaults instead of
`getPermissiveState()` is blind to them.

**Every multi-select filter reads as "or".** They all match a film satisfying
_any_ selected value — two directors returns the films of either, not the films
they made together — so `formatList` takes a conjunction and each of them passes
"or": "directed by Ridley Scott or George Lucas and starring Mark Hamill".

**Order is editorial, never by count.** Sorting by result count would promote "drop your
Subtitles requirement" whenever it frees up the most screenings, which is the one suggestion a
subtitles user cannot act on. Accessibility ranks last and is never combined with another
move (`soloOnly`) — it is a requirement, not a preference. Search queries are redirected,
never dropped — except a stale second query beside a film title query, above.

**Rounds stop at two.** Redirects, then single widens, then pairs. A three-filter relaxation
is a reset with extra steps, so the caller offers a reset instead.

**Cost decides order, not visibility.** The search runs until it has `limit` offers — it does
_not_ stop at the first productive round. A redirect and a widening answer different questions
about different films ("wrong field" vs "filters too narrow"), so a cheap redirect must not
suppress an expensive pair. Searching "word" turns up a performance note straight away while
the film called "Words" sits outside the date window _and_ in an excluded category, reachable
only as a pair. The one thing skipped is a pair whose halves already work individually — that
is a more expensive route to results already listed.

**Each offer is a headline plus one line per filter it changes.**

- The **headline** must read as something you can do. A bare filter name ("Any date") reads as
  a caption, not a button, so a widening-only offer names the films it would reveal instead
  (`Show "A" & "B"`, `Show "A" & 29 more`). A move that rewrites the query — a correction or a
  redirect — leads instead, since that is the part the reader has to agree to.
- **Change lines** are `Label: detail`, where the detail comes from the move's `describeResult`
  against the probe result. One line each, never joined: joining produced
  `Did you mean "X"?, any date` — a comma after a question mark, with the second change buried
  at the end of the first.
- A move whose action is already the headline contributes only its detail, so nothing is said
  twice. A correction has no detail, so it drops out entirely — reporting a next-showing date
  under a correction implied the date window had moved when it had not. **The next-showing date
  belongs to the date widening alone.**
- Dates are relative inside a fortnight ("next showing in 8 days"), absolute beyond it, where
  counting is harder than reading.
- Naming categories and venues needs the `categories`/`venues` lookups passed in (same shape as
  `describeFilters`); without them offers degrade to bare counts rather than breaking.
  Accessibility has no detail by design, since any detail there argues for giving up a
  requirement.

**The engine checks its own precondition.** `suggestFilterRelaxations` returns `[]` when the
state it is handed already has results. The caller's idea of "empty" is easy to take from a
different state than the one passed in — see the deferred copy below — and one keystroke of
daylight was enough to offer improvements to a query that had results.

**When several corrections tie** (a one-edit query is routinely one edit from a dozen titles,
all through the same word), the sort breaks the tie by **reach**, then screening count, then
soonest showing. Alphabetical is the one ordering with nothing to recommend it; only two
corrections are ever offered, so the tie-break decides what the reader actually sees.

Reach (`correctionReach`) is how many filter changes the correction needs on top of the
rewrite: 0 if the current filters already show the film, 1 if one widening does. A candidate
needing more is dropped before the cut, since rounds stop at two and it could only ever be
probed and discarded. Ranking on screenings alone let "mark h" spend both slots on a festival
outside the date window and a talk no pair could reach, while "Sherman's March", showing
that week, was never looked at. Each check runs the pipeline over the one film, not the
dataset.

**On the films page** the empty state pulls up under the search controls whenever it carries
offers (`.emptyStateNearControls`) — centred in the viewport put them half a screen from the box
the query was typed into. Suggestions ride a `useDeferredValue` copy of the filter state so
typing stays responsive; React keeps the previous offers on screen while a pass catches up,
which is deliberate — blanking them flickered the empty state on every keypress.

### On a film page

When the filters hide every showing of the film being looked at, the showings
section's empty state carries offers from `suggestShowingRelaxations`, beside
the existing **Show all** button. It shares `findOffers` with the grid engine, so
ordering, the two-change limit, pair collisions and `soloOnly` accessibility
cannot drift between the two. What differs:

- **Only widenings.** Filter-value, people, redirect and correction moves all
  answer "your query named the wrong thing", and a film page's subject is fixed.
- **Queries are dropped, not redirected.** A search left over from the grid
  ("alien", "Q&A" in notes) can hide every showing of the film opened next, and
  nothing but a reset would otherwise say so. This is the one place a query is
  given up; it sits after the widenings and before accessibility.
- **Counts are showings.** In films every offer would read "1 result", and a
  widen headline would name the film already on screen — so the headline is the
  action itself ("Search all dates and search all venues").
- **Offers write the global filter state**, as on the grid. An offer is a filter
  change; "Show all" is the way to look past the filters without changing them.

It probes one film, so it runs on the live state rather than a deferred copy.

**"Playing at" counts the showings listed below it**, not the build-time
totals, so a venue the filters hide isn't named above a list with none of its
showings. The static HTML keeps the build-time counts until the listings load.
When narrowed it says "4 of 102 venues match your filters" with the showings'
own Show all beside it, so a venue missing from the list doesn't read as the
film not playing there. When the filters hide every showing it keeps the full
list: the empty state below explains, and an empty "Playing at" would hide
where the film is on.

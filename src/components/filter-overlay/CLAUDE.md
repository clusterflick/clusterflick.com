# Filter Overlay

The filters themselves are documented in `packages/catalogue/src/filters/CLAUDE.md`.

`FilterOverlay` (`src/components/filter-overlay/`) is being reorganised in stages
around progressive disclosure: the most used filters in front, every filter
findable, and a filter that is set never hidden.

**Core filters and Refine.** Dates, Venues and Events are always in view:
Dates and Venues in the left column, Events at the top of the right one;
everything else is a Refine row below Events, one line each
naming the filter and what it is set to (`RefineRow`, `filter-targets.ts`):
Accessibility, Showings (hide past / sold out, moved out of the Dates
header), Format, Genre, Ratings, Directors & cast, Films, and Clubs &
festivals. Rows with an index page (formats, genres, clubs, festivals) link to
it at the top of the row.
Side by side so the Refine list starts on screen and opening a row can't push
the core down; one column below 1200px, in the same order. Events moved across
to balance the columns: with all three core filters on the left it ran ~500px
past Refine, and now the two end within ~130px. It sits above Refine rather
than below, since rows open downwards and some are taller than the screen —
below them, opening one would push a core filter out of view. Every name is readable
without opening anything, which is what makes a filter findable, and opening
one reveals one filter rather than the dozen "More Event Options" held.
Accessibility comes first: it is a requirement for those who use it.

**Rows open themselves** when their filter becomes set, on mount included, and
never close themselves — the old `expandWhen` rule, per row instead of for the
whole bucket. The overlay owns which rows are open, so the strip can open one.

**Row summaries are the strip's chip labels**, grouped by `FILTER_TARGETS` (a
`Record<FilterId, …>`, so a new filter won't compile until it has a place), so
a row and its chip can't describe a filter differently. Showings is worded on
its own, since its default has no chip.

**The search box also finds filters** (`FilterSearch`, matching in
`@clusterflick/catalogue/filters/filter-search`). Typing still searches titles live; a menu
under it offers the filter values the query names — event types, genres,
formats, accessibility (with the suggestion engine's aliases, so "subs" finds
Subtitles), directors, cast, clubs, festivals and venues — plus the two other
text fields to search instead. Nothing is highlighted until the reader arrows
down, so Enter and typing mean what they always did. A pick toggles the value
into its filter and clears the box (the query was the value's name); picking
into a filter at everything or its default selects just that value, so
"Quizzes" means quizzes rather than films and quizzes. Downshift's blur-picks
and Escape-clears are overridden: this box is also the title search.

- **Venues are in, unlike the suggestion engine**: there a name colliding
  with a title would be read as the answer; here it is one candidate of
  several and the reader picks. **Films are out**: the box already searches
  titles, so a film row would offer the same thing twice.
- **Matching is per word**: the query's words must be a run of the name's
  words, the last one possibly a prefix ("alfred hitch", never "cock"). The
  last word is compared folded only when it ends in an inflection
  ("subtitled", "dramas"); folding a word still being typed made "mar" a whole
  match for Kenneth Mars.
- **Whole-word matches rank first**, then group order (enumerated
  vocabularies, directors, cast, clubs, festivals, venues), so "rio" lists Rio
  Cinema above Louise Rioton. Up to three per group, ten in all.
- **It runs off a sorted word index**, built in idle time when the overlay
  opens (`prepareFilterSearch`). Scanning the 13,000 names cost ~12ms a
  keystroke whatever was typed; the index answers in 0–3ms. Building it is
  ~175ms, which is why it's done before the first keystroke rather than on it,
  and only for readers who open the overlay.

**The counts bar is pinned** on desktop and tablet. It reaches up to the top of
the overlay and sticks at 0, carrying the room under the site header as its own
padding: a sticky element can't be pulled up into its container's padding with
a negative margin, which slid it down over the search box. Not pinned on a
phone, where under the trigger's wrapped description it took over half the
screen; there a "Show N events" button sticks to the bottom instead. The
overlay has no bottom padding on a phone, because sticky offsets are measured
from the scroll container's content edge and its 60px left the button
floating above the bottom of the screen.

The open trigger's description draws a dark box-shadow ~60px deep to stay
legible over what scrolls beneath it, and the header sits above the overlay,
so the shadow dims anything that close. Above 700px the pinned counts bar
already backs the description, so the trigger drops the shadow there and the
counts sit 24px under it; on a phone the bar scrolls away, the shadow stays,
and the counts keep a 66px gap. The trigger's media query is tied to the
overlay's 700px breakpoint.

**Presets are slim pills in the bar**: "Near me today" and "This week".
"Show everything" is the third preset, but as the way out of every filter it
sits beside Reset as a link.

**The active-filters strip** (`describeFilterChips` in `@clusterflick/catalogue/filters/describe`)
lists every filter narrowing the results as a chip, driven by
`getRestrictiveFilterIds` so the restrictive defaults (date window, event
types) appear too, marked Default. Removing a chip widens its filters to
permissive (`widenFilters`), not back to the default, so removing "Next 7 Days"
shows every date. Hide finished showings is left out, being on in every visit
and hiding only what nobody can go to. A chip's label goes to its controls —
opening its Refine row, centring the row's trigger (not the row, which can be
taller than the screen and put its heading under the bar) and focusing it.

**Usage is tracked** to decide what belongs in front: `filter-preset`,
`filter-reset`, `filter-share`, `filter-chip-remove`, `filter-chip-open`,
`filter-row-open`, `filter-search-pick`, `filter-search-redirect`, and
`filter-overlay-close`
with the ids of the filters that visit changed (`getChangedFilterIds`), sent
once per visit rather than per tap. Filter ids only, never values.

/**
 * The two datasets published for reuse, and the internal artifacts that are
 * not. Kept beside the page rather than in `src/data` because nothing else
 * needs them — the About page links to the same two datasets, but describes
 * them for a different audience.
 */

export const LICENSED_DATASETS = [
  {
    name: "Data file per venue",
    url: "https://github.com/clusterflick/data-transformed/releases/latest",
    description:
      "Individual JSON files for the showings at each venue, all following the same schema. The fullest form of the data, and the one to build on.",
  },
  {
    name: "Calendar file per venue",
    url: "https://github.com/clusterflick/data-calendar/releases/latest",
    description:
      "Individual ICS files for the showings at each venue. Subscribe to one, or hand them to anything that speaks iCalendar.",
  },
];

/**
 * The same credit in the three forms people actually need to paste. Kept
 * verbatim so that what a reader copies is what appears on their page.
 */
export const ATTRIBUTION_SNIPPETS = [
  {
    label: "Markdown",
    value:
      "Screening data from [Clusterflick](https://clusterflick.com) (CC BY 4.0)",
  },
  {
    label: "HTML",
    value:
      'Screening data from <a href="https://clusterflick.com">Clusterflick</a> (CC BY 4.0)',
  },
  {
    label: "Plain text",
    value: "Screening data from Clusterflick - clusterflick.com (CC BY 4.0)",
  },
];

export const INTERNAL_REPOS = [
  {
    name: "data-retrieved",
    note: "Raw scrapes, stored close to verbatim. The content belongs to the venue sites it came from.",
  },
  {
    name: "data-combined",
    note: "Everything merged into one file for the website to load. Carries whatever the upstream stages carry.",
  },
  {
    name: "data-cached",
    note: "Film metadata cached from TMDB. Theirs, not ours — get it from TMDB under your own terms.",
  },
  {
    name: "data-matched",
    note: "Ratings from IMDb, Letterboxd, Metacritic, Rotten Tomatoes and the Bechdel Test, each belonging to its source.",
  },
  {
    name: "data-diffed",
    note: "What changed between two runs, so the New Listings feed doesn't have to recompute it.",
  },
  {
    name: "data-analysed",
    note: "Hourly venue health telemetry, driving the status panel on the About page.",
  },
];

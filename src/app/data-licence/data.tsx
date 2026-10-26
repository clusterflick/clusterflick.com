/**
 * The credit to copy, and the internal artifacts that are not licensed for
 * reuse. Kept beside the page rather than in `src/data` because nothing else
 * needs them. Where the datasets live is in `@/app/datasets/data`, beside the
 * page that documents them.
 */

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

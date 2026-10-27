import {
  DATA_INDEX_URL,
  DATA_LATEST_URL,
  DATA_SCHEMA_URL,
  LICENSED_DATASETS,
} from "@/app/datasets/data";

const SITE = "https://clusterflick.com";

// Pages are exported with `trailingSlash: true`, so their canonical address
// ends in "/", as the sitemap's do. Dataset files are files and keep theirs.
function pageUrl(path: string): string {
  return `${SITE}${path.endsWith("/") ? path : `${path}/`}`;
}

/**
 * An index for language models and agents (https://llmstxt.org). It leads with
 * the published datasets, because that is where a question about what's on is
 * best answered: fixed addresses, a schema and a licence, rather than pages
 * whose markup carries no promise. The pages follow as URL shapes, not a list
 * — the sitemap already lists them, and they change weekly.
 */
export function buildLlmsTxt(): string {
  const datasets = LICENSED_DATASETS.map(
    ({ name, pattern, archive }) =>
      `- [${name}](${pattern}): one per venue, ids listed in index.json. Earlier releases: ${archive}`,
  ).join("\n");

  return `# Clusterflick

> Every film showing in London, from 450+ cinemas and venues in one search: showtimes, venues, film clubs and festivals, updated several times a day.

Listings come from each venue's own website, matched to TheMovieDB and to IMDb, Letterboxd and Rotten Tomatoes ratings. For machine use, prefer the datasets below to the pages: they have fixed addresses and a schema, while the pages' markup can change at any time.

## Datasets

Licensed CC BY 4.0. Credit Clusterflick and link to ${pageUrl("/data-licence")}.

- [Index](${DATA_INDEX_URL}): every venue (name, address, coordinates, its page here) with the addresses of its files and the releases they came from
- [Latest](${DATA_LATEST_URL}): the index's \`releases\` alone, cheap to poll. Compare the release tags to detect new data, not \`generatedAt\`, which changes on every deploy
- [Schema](${DATA_SCHEMA_URL}): JSON Schema for the per-venue data files
${datasets}
- [Dataset documentation](${pageUrl("/datasets")}): contents, update frequency and how to detect new data
- [Licence](${pageUrl("/data-licence")})
- [Release history](${pageUrl("/datasets/status")})

## Pages

- [Home](${SITE}/): highlights of what's showing
- [Catalogue](${pageUrl("/catalogue")}): every film showing, searchable and filterable. Filters are kept in the query string; \`base=all\` widens past the default of films in the next seven days
- [Venues](${pageUrl("/venues")}): every venue. A venue's page is ${SITE}/venues/<venue-name-slug>/
- Films: ${SITE}/movies/<movie-id>/<title-slug>/, with every showing, venue and rating
- [Cinemas by borough](${pageUrl("/london-cinemas")}) and [cinema chains](${pageUrl("/cinema-groups")})
- [Film clubs](${pageUrl("/film-clubs")}) and [festivals](${pageUrl("/festivals")})
- [Film lists](${pageUrl("/lists")}): award winners and top-film lists, with which members are showing
- [Genres](${pageUrl("/genres")}) and [formats](${pageUrl("/formats")}) (35mm, 70mm, IMAX and others)
- [Updates](${pageUrl("/updates")}): films and showings added in each release, also as an [RSS feed](${SITE}/updates/feed.xml)

## Optional

- [About](${pageUrl("/about")}): sources and credits
- [Sitemap](${SITE}/sitemap.xml): every page
`;
}

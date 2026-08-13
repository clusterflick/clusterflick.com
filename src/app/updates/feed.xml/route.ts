import { getStaticData } from "@/utils/get-static-data";
import {
  buildUpdates,
  getUpdateReleasePath,
  pluralise,
  readDiffBlobs,
  summariseRelease,
} from "@/utils/get-updates";
import type { UpdateFilm, UpdateRelease } from "@/utils/get-updates";
import { formatDateLong, formatShowingTime } from "@/utils/format-date";

export const dynamic = "force-static";

const SITE = "https://clusterflick.com";
const FEED_URL = `${SITE}/updates/feed.xml`;

/** Escapes the five XML entities. Applied to every value put into the feed. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RSS requires RFC 822 dates. `toUTCString` produces the RFC 1123 form, which
 * is the four-digit-year update to it that every reader accepts.
 */
function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

function absolute(href: string): string {
  return `${SITE}${href}`;
}

/** The same wording the page uses, so an item reads like its section. */
function releaseTitle(release: UpdateRelease): string {
  const published = new Date(release.asOf);
  return `${formatDateLong(published)} @ ${formatShowingTime(published.getTime())}`;
}

function filmLine(film: UpdateFilm, showingWord: string): string {
  const title = film.href
    ? `<a href="${escapeXml(absolute(film.href))}">${escapeXml(film.title)}</a>`
    : escapeXml(film.title);

  const venues = film.venues
    .map((venue) =>
      venue.href
        ? `<a href="${escapeXml(absolute(venue.href))}">${escapeXml(venue.name)}</a>`
        : escapeXml(venue.name),
    )
    .join(", ");

  const count = pluralise(film.performanceCount, showingWord);
  // As on the page, a single venue names itself and more than one leads with
  // the count. The feed never truncates the list — an item is read once.
  const at =
    film.venues.length > 1
      ? `${escapeXml(pluralise(film.venues.length, "venue"))}: ${venues}`
      : venues;
  return `<li>${title} — ${count} at ${at}</li>`;
}

/**
 * The item body, mirroring what the page shows for the same run: what's new,
 * then what gained showings. Readers strip unknown markup, so this stays to
 * paragraphs and lists rather than trying to carry the page's layout.
 */
function describeRelease(release: UpdateRelease): string {
  const sections: string[] = [`<p>${escapeXml(summariseRelease(release))}</p>`];

  if (release.newVenues.length > 0) {
    const venues = release.newVenues
      .map((venue) =>
        venue.href
          ? `<a href="${escapeXml(absolute(venue.href))}">${escapeXml(venue.name)}</a>`
          : escapeXml(venue.name),
      )
      .join(", ");
    sections.push(
      `<h2>${release.newVenues.length === 1 ? "New venue" : "New venues"}</h2><p>${venues}</p>`,
    );
  }

  if (release.newFilms.length > 0) {
    sections.push(
      `<h2>${escapeXml(pluralise(release.newFilms.length, "new film"))}</h2>` +
        `<ul>${release.newFilms.map((film) => filmLine(film, "showing")).join("")}</ul>`,
    );
  }

  if (release.moreShowings.length > 0) {
    sections.push(
      `<h2>More showings</h2>` +
        `<ul>${release.moreShowings
          .map((film) => filmLine(film, "new showing"))
          .join("")}</ul>`,
    );
  }

  return sections.join("");
}

export async function GET() {
  const data = await getStaticData();
  const releases = buildUpdates(readDiffBlobs(), data);

  // Items link to the run's dated page, not to `/updates`. The landing page
  // carries only the latest day, so a link there would quietly land a reader on
  // a different run than the item they clicked — and an anchor into it would
  // resolve against nothing. The dated URL is exact while it exists and 404s
  // honestly once its diff ages out of the window, which the feed outlives:
  // items sit in readers indefinitely, so this is the one surface that produces
  // clicks on updates that have rolled out. `not-found.tsx` explains those.
  const items = releases
    .map(
      (release) => `    <item>
      <title>${escapeXml(releaseTitle(release))}</title>
      <link>${escapeXml(`${SITE}${getUpdateReleasePath(release)}`)}</link>
      <guid isPermaLink="false">clusterflick-updates-${escapeXml(release.tag)}</guid>
      <pubDate>${toRfc822(release.asOf)}</pubDate>
      <description>${escapeXml(describeRelease(release))}</description>
    </item>`,
    )
    .join("\n");

  // Falls back to the dataset's own timestamp so a feed with no runs yet still
  // carries a sensible build date.
  const lastBuildDate = toRfc822(releases[0]?.asOf ?? data.generatedAt);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Clusterflick — Updates</title>
    <link>${SITE}/updates/</link>
    <description>New films, new showings and new venues added to Clusterflick's London cinema listings.</description>
    <language>en-GB</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

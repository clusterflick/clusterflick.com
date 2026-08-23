import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import {
  getCollectionsData,
  findCollection,
} from "@/utils/get-collections-data";
import { getCollectionUrl } from "@/utils/get-collection-url";
import {
  getCollectionScreenings,
  getCollectionEvents,
} from "@/utils/get-collection-movies";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@/utils/get-movie-url";
import type { Collection, Movie } from "@/types";
import type { FilmPosterGridMovie } from "@/components/film-poster-grid";
import CollectionDetailPageContent from "./page-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(getCollectionsData()).map((collection) => ({
    slug: collection.slug,
  }));
}

function pageTitle(collection: Collection): string {
  return `${collection.name} Films Showing in London`;
}

function buildDescription(
  collection: Collection,
  showingCount: number,
  partCount: number,
): string {
  // Phrased as "films from <name>" rather than "the <name> films", because
  // plenty of collections are themselves named "The Godfather", "The Lord of
  // the Rings" — anything with a leading article stacks up badly.
  if (showingCount > 0) {
    const filmWord = showingCount === 1 ? "film" : "films";
    return `${showingCount} of ${partCount} ${filmWord} from ${collection.name} showing in London cinemas — find screenings and book tickets.`;
  }

  return `All ${partCount} films from ${collection.name}. Nothing is showing in London right now — check back soon.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = findCollection(slug);

  if (!collection) {
    return { title: "Collection Not Found" };
  }

  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();
  const { showing, entries } = getCollectionScreenings(
    collection,
    data.movies,
    nowTs,
  );

  const title = pageTitle(collection);
  const description = buildDescription(
    collection,
    showing.length,
    entries.length,
  );
  const canonicalUrl = getCollectionUrl(collection);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      url: `https://clusterflick.com${canonicalUrl}`,
      siteName: "Clusterflick",
    },
    twitter: {
      card: "summary",
      title: `${title} | Clusterflick`,
      description,
      creator: "@clusterflick",
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = findCollection(slug);

  if (!collection) {
    notFound();
  }

  const canonicalUrl = getCollectionUrl(collection);
  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();
  const { entries, showing } = getCollectionScreenings(
    collection,
    data.movies,
    nowTs,
  );

  // One grid holding the whole series in release order — a collection reads as
  // a run, and it's the gaps that tell you what you've missed. The grid is
  // ordered by release date rather than by how widely each film is showing, so
  // part 1 stays before part 3. Three states: bookable on its own, bookable
  // only inside a double bill or marathon, and not showing at all.
  const gridMovies: FilmPosterGridMovie[] = entries.map(
    ({ part, movie, event, performanceCount }) => {
      if (movie) return { movie, performanceCount };

      const film = {
        id: part.id,
        title: part.title,
        posterPath: part.posterPath,
        year: part.releaseDate?.split("-")[0],
      };

      if (event) {
        return {
          movie: film,
          performanceCount,
          linkTo: event,
          notice:
            event.includedMovies?.length === 2
              ? "As part of a double bill"
              : "As part of a marathon",
        };
      }

      return {
        movie: film,
        performanceCount: 0,
        unavailable: true,
        notice: "Not currently showing",
      };
    },
  );

  // Marathons and double bills drawing on this collection.
  const containingEvents = getCollectionEvents(collection, data.movies, nowTs);

  // Standalone screenings plus each event once. Summing the entries instead
  // would count a six-film marathon's single performance six times, once per
  // film of the collection it carries.
  const performanceCount =
    showing.reduce(
      (total, entry) => total + (entry.movie ? entry.performanceCount : 0),
      0,
    ) + containingEvents.reduce((total, e) => total + e.performanceCount, 0);

  // The collection's own poster backs the hero — it's the artwork that stands
  // for the whole series, where any single film's poster would misrepresent it.
  // Still a poster, matching how the genre and format heroes are treated.
  const heroPoster = collection.posterPath;
  const heroBackgroundImage = heroPoster
    ? `https://image.tmdb.org/t/p/w780${heroPoster}`
    : undefined;

  // Aggregate the cinemas across the collection's upcoming performances.
  //
  // No accessibility breakdown here, unlike the genre and format pages. Those
  // aggregate hundreds of films, where "47 films with subtitles" is a way into
  // the list. A collection holds a handful, so the same block reads "1 film
  // with subtitles" — which the film's own page tells you faster, and which
  // only appeared on a third of collections anyway.
  //
  // Marathons and double bills count too. A standalone screening contributes
  // the film itself; an event contributes every film of this collection it
  // carries, so a cinema running the first eight instalments back to back
  // reads as showing eight of them. Aggregating the standalone half alone hid
  // a venue whose only involvement was an event — and on the collections whose
  // films screen exclusively that way, that emptied the section outright.
  const venueSources: { movie: Movie; filmIds: string[] }[] = [
    ...showing.flatMap(({ movie }) =>
      movie ? [{ movie, filmIds: [movie.id] }] : [],
    ),
    ...containingEvents.map(({ movie }) => ({
      movie,
      filmIds: (movie.includedMovies ?? [])
        .filter((included) => included.collectionId === collection.id)
        .map((included) => included.id),
    })),
  ];

  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const { movie, filmIds } of venueSources) {
    for (const perf of movie.performances) {
      if (perf.time < nowTs) continue;
      const showingEntry = movie.showings[perf.showingId];
      if (!showingEntry) continue;
      const { venueId } = showingEntry;
      if (!venueFilmSets.has(venueId)) venueFilmSets.set(venueId, new Set());
      const films = venueFilmSets.get(venueId)!;
      for (const filmId of filmIds) films.add(filmId);
      venuePerfCounts.set(venueId, (venuePerfCounts.get(venueId) ?? 0) + 1);
    }
  }

  const collectionVenues = [...venueFilmSets.entries()]
    .map(([venueId, films]) => {
      const venue = data.venues[venueId];
      return {
        id: venueId,
        name: venue?.name ?? venueId,
        href: venue ? getVenueUrl(venue) : "#",
        type: venue?.type ?? "Other",
        imagePath: getVenueImagePath(venueId),
        filmCount: films.size,
        performanceCount: venuePerfCounts.get(venueId) ?? 0,
      };
    })
    .sort((a, b) => b.filmCount - a.filmCount || a.name.localeCompare(b.name))
    .slice(0, 24);

  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;
  const collectionJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: pageTitle(collection),
      description: buildDescription(collection, showing.length, entries.length),
      url: fullCanonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Clusterflick",
        url: "https://clusterflick.com",
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: entries.length,
        itemListElement: entries.map(({ part, movie }, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Movie",
            name: part.title,
            ...(movie && {
              url: `https://clusterflick.com${getMovieUrl(movie)}`,
            }),
          },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Film Collections",
          item: "https://clusterflick.com/collections",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: collection.name,
          item: fullCanonicalUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <CollectionDetailPageContent
        collection={collection}
        canonicalUrl={canonicalUrl}
        gridMovies={gridMovies}
        containingEvents={containingEvents}
        showingCount={showing.length}
        performanceCount={performanceCount}
        heroBackgroundImage={heroBackgroundImage}
        venues={collectionVenues}
      />
    </>
  );
}

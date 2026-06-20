import type { CinemaData } from "@/types";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { getFilmClubImagePath } from "@/utils/get-film-club-image";
import { getFilmClubCurrentMovies } from "@/utils/get-film-club-movies";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { FILM_CLUBS } from "@/data/film-clubs";

/**
 * Shared build-time precompute for location-aware sections. Used by both the
 * full `/near-me` page and the home page's "Near You" teaser so the two never
 * diverge.
 */

export type NearMeVenue = {
  id: string;
  name: string;
  href: string;
  type: string;
  imagePath: string | null;
  lat: number;
  lon: number;
  boroughSlug: string | null;
  filmCount: number;
  performanceCount: number;
};

export type NearMeFilmClub = {
  id: string;
  name: string;
  href: string;
  imagePath: string | null;
  seoDescription: string | null;
  movieCount: number;
  performanceCount: number;
  venueIds: string[];
};

/**
 * Every venue with its film/performance counts and resolved borough, ready to
 * be sorted by distance on the client.
 */
export function getNearMeVenues(data: CinemaData): NearMeVenue[] {
  const venuesByBorough = groupVenuesByBorough(data.venues);

  const venueFilmIds = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const movie of Object.values(data.movies)) {
    for (const showing of Object.values(movie.showings)) {
      if (!venueFilmIds.has(showing.venueId)) {
        venueFilmIds.set(showing.venueId, new Set());
      }
      venueFilmIds.get(showing.venueId)!.add(movie.id);
    }
    for (const perf of movie.performances) {
      const showing = movie.showings[perf.showingId];
      if (showing) {
        venuePerfCounts.set(
          showing.venueId,
          (venuePerfCounts.get(showing.venueId) ?? 0) + 1,
        );
      }
    }
  }

  const venueBoroughMap = new Map<string, string>();
  for (const [boroughSlug, boroughVenues] of venuesByBorough) {
    for (const v of boroughVenues) {
      venueBoroughMap.set(v.id, boroughSlug);
    }
  }

  return Object.values(data.venues).map((venue) => ({
    id: venue.id,
    name: venue.name,
    href: getVenueUrl(venue),
    type: venue.type,
    imagePath: getVenueImagePath(venue.id),
    lat: venue.geo.lat,
    lon: venue.geo.lon,
    boroughSlug: venueBoroughMap.get(venue.id) ?? null,
    filmCount: venueFilmIds.get(venue.id)?.size ?? 0,
    performanceCount: venuePerfCounts.get(venue.id) ?? 0,
  }));
}

/**
 * Film clubs with their current (upcoming) movies and the venues they're
 * screening at — the same set the film club detail page shows, so counts match
 * on click-through.
 */
export async function getNearMeFilmClubs(
  data: CinemaData,
): Promise<NearMeFilmClub[]> {
  return Promise.all(
    FILM_CLUBS.map(async (club) => {
      const currentMovies = getFilmClubCurrentMovies(club, data.movies);
      const movieCount = Object.keys(currentMovies).length;

      const venueIdSet = new Set<string>();
      let performanceCount = 0;
      for (const movie of Object.values(currentMovies)) {
        performanceCount += movie.performances.length;
        for (const perf of movie.performances) {
          const showing = movie.showings[perf.showingId];
          if (showing) venueIdSet.add(showing.venueId);
        }
      }

      let seoDescription: string | null = null;
      try {
        const mod = await import(`@/components/film-clubs/${club.id}`);
        seoDescription = mod.seoDescription ?? null;
      } catch {
        // No blurb component for this club
      }

      return {
        id: club.id,
        name: club.name,
        href: getFilmClubUrl(club),
        imagePath: getFilmClubImagePath(club.id),
        seoDescription,
        movieCount,
        performanceCount,
        venueIds: [...venueIdSet],
      };
    }),
  );
}

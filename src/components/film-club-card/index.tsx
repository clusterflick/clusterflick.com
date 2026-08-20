import VenueCard from "@/components/venue-card";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import type { MovieFilmClub } from "@/utils/get-movie-film-clubs";

interface FilmClubCardProps {
  filmClub: MovieFilmClub;
}

/**
 * A film club rendered as a `VenueCard`: logo, name and the counts for the
 * club's whole current programme — the same numbers as the club page it links
 * to, so a reader arriving there recognises what they clicked.
 *
 * There is no date line, as there is on `FestivalCard`: a club has no run.
 */
export default function FilmClubCard({ filmClub }: FilmClubCardProps) {
  return (
    <VenueCard
      href={getFilmClubUrl(filmClub)}
      name={filmClub.name}
      imagePath={filmClub.imagePath}
      filmCount={filmClub.movieCount}
      performanceCount={filmClub.performanceCount}
    />
  );
}

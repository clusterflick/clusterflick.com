import FestivalCard from "@/components/festival-card";
import FilmClubCard from "@/components/film-club-card";
import SectionHeading from "@/components/section-heading";
import type { MovieFestival } from "@/utils/get-movie-festivals";
import type { MovieFilmClub } from "@/utils/get-movie-film-clubs";
import styles from "./screening-as-part-of.module.css";

interface ScreeningAsPartOfProps {
  festivals: MovieFestival[];
  filmClubs: MovieFilmClub[];
}

/**
 * The programmes a film screens under — festivals first, then film clubs. Both
 * answer the same question ("who is putting this on?"), so they share one
 * heading rather than splitting into two near-identical sections.
 */
export default function ScreeningAsPartOf({
  festivals,
  filmClubs,
}: ScreeningAsPartOfProps) {
  if (festivals.length === 0 && filmClubs.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <SectionHeading>Screening as part of</SectionHeading>
      {festivals.map((festival) => (
        <FestivalCard key={festival.id} festival={festival} />
      ))}
      {filmClubs.map((filmClub) => (
        <FilmClubCard key={filmClub.id} filmClub={filmClub} />
      ))}
    </div>
  );
}

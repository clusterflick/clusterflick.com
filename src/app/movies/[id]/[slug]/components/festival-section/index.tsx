import VenueCard from "@/components/venue-card";
import { formatDateShort } from "@/utils/format-date";
import { getFestivalUrl } from "@/utils/get-festival-url";
import type { MovieFestival } from "@/utils/get-movie-festivals";
import styles from "./festival-section.module.css";

interface FestivalSectionProps {
  festivals: MovieFestival[];
}

/** "24 Feb – 5 Mar", or a single date when the festival runs for one day. */
function formatDateRange(
  dateFrom: number | null,
  dateTo: number | null,
): string | undefined {
  if (dateFrom === null || dateTo === null) return undefined;

  const options = { includeYearIfDifferent: true };
  const from = formatDateShort(new Date(dateFrom), options);
  if (new Date(dateFrom).toDateString() === new Date(dateTo).toDateString()) {
    return from;
  }

  return `${from} – ${formatDateShort(new Date(dateTo), options)}`;
}

export default function FestivalSection({ festivals }: FestivalSectionProps) {
  if (festivals.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.label}>Screening as part of</h2>
      {festivals.map((festival) => (
        <VenueCard
          key={festival.id}
          href={getFestivalUrl(festival)}
          name={festival.name}
          imagePath={festival.imagePath}
          detail={formatDateRange(festival.dateFrom, festival.dateTo)}
          filmCount={festival.movieCount}
          performanceCount={festival.performanceCount}
        />
      ))}
    </div>
  );
}

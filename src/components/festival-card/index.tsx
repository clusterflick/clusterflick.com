import VenueCard from "@/components/venue-card";
import { formatDateShort } from "@/utils/format-date";
import { getFestivalUrl } from "@/utils/get-festival-url";
import type { MovieFestival } from "@/utils/get-movie-festivals";

interface FestivalCardProps {
  festival: MovieFestival;
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

/**
 * A festival rendered as a `VenueCard`: logo, name, date range and the counts
 * for the whole festival — the same numbers as the festival page it links to,
 * so a reader arriving there recognises what they clicked.
 */
export default function FestivalCard({ festival }: FestivalCardProps) {
  return (
    <VenueCard
      href={getFestivalUrl(festival)}
      name={festival.name}
      imagePath={festival.imagePath}
      detail={formatDateRange(festival.dateFrom, festival.dateTo)}
      filmCount={festival.movieCount}
      performanceCount={festival.performanceCount}
    />
  );
}

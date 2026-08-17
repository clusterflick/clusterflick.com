import FestivalCard from "@/components/festival-card";
import SectionHeading from "@/components/section-heading";
import type { MovieFestival } from "@/utils/get-movie-festivals";
import styles from "./festival-section.module.css";

interface FestivalSectionProps {
  festivals: MovieFestival[];
}

export default function FestivalSection({ festivals }: FestivalSectionProps) {
  if (festivals.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <SectionHeading>Screening as part of</SectionHeading>
      {festivals.map((festival) => (
        <FestivalCard key={festival.id} festival={festival} />
      ))}
    </div>
  );
}

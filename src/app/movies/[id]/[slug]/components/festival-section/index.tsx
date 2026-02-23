import Link from "next/link";
import { getFestivalUrl } from "@/utils/get-festival-url";
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
      {festivals.map((festival) => (
        <p key={festival.id} className={styles.line}>
          Screening as part of{" "}
          <Link href={getFestivalUrl(festival)}>{festival.name}</Link>
        </p>
      ))}
    </div>
  );
}

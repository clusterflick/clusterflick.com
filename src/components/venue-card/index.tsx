import Image from "next/image";
import NavCard from "@/components/nav-card";
import Tag from "@/components/tag";
import styles from "./venue-card.module.css";

interface VenueCardProps {
  href: string;
  name: string;
  type: string;
  imagePath: string | null;
  filmCount?: number;
  performanceCount?: number;
}

export default function VenueCard({
  href,
  name,
  type,
  imagePath,
  filmCount,
  performanceCount,
}: VenueCardProps) {
  return (
    <NavCard href={href} className={styles.card}>
      <div className={styles.logo}>
        {imagePath ? (
          <Image
            src={imagePath}
            alt={`${name} logo`}
            width={48}
            height={48}
            className={styles.image}
          />
        ) : (
          <span className={styles.initial}>{name.charAt(0)}</span>
        )}
      </div>
      <div className={styles.body}>
        <span className={styles.name}>{name}</span>
        <div className={styles.meta}>
          <Tag color="blue" size="sm">
            {type.toLowerCase() === "unknown" ? "Other" : type}
          </Tag>
        </div>
        {filmCount !== undefined && performanceCount !== undefined && (
          <span className={styles.stats}>
            {filmCount > 0 ? (
              <>
                {filmCount.toLocaleString("en-GB")}{" "}
                {filmCount === 1 ? "film" : "films"} &middot;{" "}
                {performanceCount.toLocaleString("en-GB")}{" "}
                {performanceCount === 1 ? "showing" : "showings"}
              </>
            ) : (
              "No showings currently listed"
            )}
          </span>
        )}
      </div>
    </NavCard>
  );
}

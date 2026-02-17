import { Person } from "@/types";
import CreditsList from "@/components/credits-list";
import styles from "./cast-crew-section.module.css";

interface CastCrewSectionProps {
  directors: string[] | undefined;
  actors: string[] | undefined;
  people: Record<string, Person>;
}

const getNames = (ids: string[], people: Record<string, Person>) =>
  ids.map((id) => people[id]?.name).filter(Boolean) as string[];

export default function CastCrewSection({
  directors,
  actors,
  people,
}: CastCrewSectionProps) {
  const hasDirectors = directors && directors.length > 0;
  const hasActors = actors && actors.length > 0;

  if (!hasDirectors && !hasActors) {
    return null;
  }

  const actorNames = actors ? getNames(actors, people) : [];

  return (
    <div className={styles.creditsGrid}>
      {hasDirectors && (
        <CreditsList
          role={`Director${directors.length > 1 ? "s" : ""}`}
          names={getNames(directors, people)}
        />
      )}

      {hasActors && (
        <>
          {/* Mobile: Show only 2 cast members */}
          <div className={styles.castMobile}>
            <CreditsList role="Cast" names={actorNames} maxDisplay={2} />
          </div>
          {/* Desktop: Show 6 cast members */}
          <div className={styles.castDesktop}>
            <CreditsList role="Cast" names={actorNames} maxDisplay={6} />
          </div>
        </>
      )}
    </div>
  );
}

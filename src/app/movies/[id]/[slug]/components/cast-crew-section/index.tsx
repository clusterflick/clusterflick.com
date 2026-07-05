import { Person } from "@/types";
import PillList from "@/components/pill-list";
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
        <PillList
          title={`Director${directors.length > 1 ? "s" : ""}`}
          items={getNames(directors, people)}
        />
      )}

      {hasActors && (
        <PillList
          title="Cast"
          items={actorNames}
          maxVisible={6}
          maxVisibleMobile={2}
        />
      )}
    </div>
  );
}

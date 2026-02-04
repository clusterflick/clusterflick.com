import { Person } from "@/types";
import CreditsList from "@/components/credits-list";
import ContentSection from "@/components/content-section";
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

  return (
    <ContentSection
      title="Cast & Crew"
      icon={{
        src: "/images/icons/neon-clapper.svg",
        width: 38,
        height: 38,
        className: styles.clapperIcon,
      }}
    >
      <div className={styles.creditsGrid}>
        {hasDirectors && (
          <CreditsList
            role={`Director${directors.length > 1 ? "s" : ""}`}
            names={getNames(directors, people)}
          />
        )}

        {hasActors && (
          <CreditsList
            role="Cast"
            names={getNames(actors, people)}
            maxDisplay={6}
          />
        )}
      </div>
    </ContentSection>
  );
}

import Link from "next/link";
import { Person } from "@/types";
import { FilterId, PeopleFilterId } from "@/lib/filters";
import { getPersonFilterUrl } from "@/utils/get-person-filter-url";
import PillList from "@/components/pill-list";
import styles from "./cast-crew-section.module.css";

interface CastCrewSectionProps {
  directors: string[] | undefined;
  actors: string[] | undefined;
  people: Record<string, Person>;
}

type CreditPill = { id: string; name: string };

const getCredits = (
  ids: string[],
  people: Record<string, Person>,
): CreditPill[] =>
  ids.flatMap((id) => {
    const name = people[id]?.name;
    return name ? [{ id, name }] : [];
  });

/**
 * Each name links into the films grid filtered to that person's credits, which
 * is where a "what else are they in?" question gets answered — there are no
 * director or cast pages to send it to, and at ~84% of directors having a
 * single film on at any time, there should not be.
 *
 * A name with nothing currently screening lands on an empty grid rather than a
 * 404, and the grid's own zero-result suggestions take it from there.
 */
const renderCredit = (filterId: PeopleFilterId) =>
  function CreditPillLink({ id, name }: CreditPill) {
    return <Link href={getPersonFilterUrl(filterId, id)}>{name}</Link>;
  };

export default function CastCrewSection({
  directors,
  actors,
  people,
}: CastCrewSectionProps) {
  const directorCredits = directors ? getCredits(directors, people) : [];
  const actorCredits = actors ? getCredits(actors, people) : [];

  if (directorCredits.length === 0 && actorCredits.length === 0) {
    return null;
  }

  return (
    <div className={styles.creditsGrid}>
      {directorCredits.length > 0 && (
        <PillList
          title={`Director${directorCredits.length > 1 ? "s" : ""}`}
          items={directorCredits}
          renderItem={renderCredit(FilterId.Directors)}
          itemNoun="directors"
        />
      )}

      {actorCredits.length > 0 && (
        <PillList
          title="Cast"
          items={actorCredits}
          renderItem={renderCredit(FilterId.Cast)}
          itemNoun="cast"
          maxVisible={4}
          maxVisibleMobile={2}
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { ReactNode } from "react";
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

/**
 * Each name links into the films grid filtered to that person's credits. A name
 * with nothing currently screening lands on an empty grid rather than a 404.
 *
 * The links are built here and passed as items rather than through PillList's
 * `renderItem`: PillList is a client component and this one is not, so a
 * callback would be a function crossing the server/client boundary. That breaks
 * only the departed movie page — the live one renders inside `page-content`,
 * which is `"use client"`. Elements cross fine; functions do not.
 */
const creditPills = (
  ids: string[],
  people: Record<string, Person>,
  filterId: PeopleFilterId,
): ReactNode[] =>
  ids.flatMap((id) => {
    const name = people[id]?.name;
    if (!name) return [];
    return [
      <Link key={id} href={getPersonFilterUrl(filterId, id)}>
        {name}
      </Link>,
    ];
  });

export default function CastCrewSection({
  directors,
  actors,
  people,
}: CastCrewSectionProps) {
  const directorPills = directors
    ? creditPills(directors, people, FilterId.Directors)
    : [];
  const actorPills = actors ? creditPills(actors, people, FilterId.Cast) : [];

  if (directorPills.length === 0 && actorPills.length === 0) {
    return null;
  }

  return (
    <div className={styles.creditsGrid}>
      {directorPills.length > 0 && (
        <PillList<ReactNode>
          title={`Director${directorPills.length > 1 ? "s" : ""}`}
          items={directorPills}
          itemNoun="directors"
        />
      )}

      {actorPills.length > 0 && (
        <PillList<ReactNode>
          title="Cast"
          items={actorPills}
          itemNoun="cast"
          maxVisible={4}
          maxVisibleMobile={2}
        />
      )}
    </div>
  );
}

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
 * Each name links into the films grid filtered to that person's credits, which
 * is where a "what else are they in?" question gets answered — there are no
 * director or cast pages to send it to, and at ~84% of directors having a
 * single film on at any time, there should not be.
 *
 * A name with nothing currently screening lands on an empty grid rather than a
 * 404, and the grid's own zero-result suggestions take it from there.
 *
 * The links are built here and handed to `PillList` as items, rather than
 * through its `renderItem` callback: `PillList` is a client component and this
 * one is not, so a callback would be a function crossing the server/client
 * boundary. That only fails on the departed movie page — the live one renders
 * inside `page-content`, which is `"use client"`, so nothing is serialised —
 * which is exactly why it survived a dev-server check and died in the export.
 * Elements cross the boundary fine; functions do not.
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

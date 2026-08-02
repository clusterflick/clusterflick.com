"use client";

import Link from "next/link";
import { getMovieListUrl } from "@/utils/get-movie-list-url";
import type { MovieListMembership } from "@/utils/get-movie-list-movies";
import PillList from "@/components/pill-list";
import styles from "./movie-lists-section.module.css";

const MAX_VISIBLE_MOBILE = 2;
const MAX_VISIBLE_DESKTOP = 4;

interface MovieListsSectionProps {
  lists: MovieListMembership[];
}

/**
 * The "top films" lists this film appears on. Each pill links to the list, and
 * shows the film's published position where the list is ranked.
 */
export default function MovieListsSection({ lists }: MovieListsSectionProps) {
  if (lists.length === 0) return null;

  return (
    <div className={styles.section}>
      <PillList
        title="Appears on"
        itemNoun="lists"
        items={lists}
        maxVisible={MAX_VISIBLE_DESKTOP}
        maxVisibleMobile={MAX_VISIBLE_MOBILE}
        renderItem={(list) => (
          <>
            <Link href={getMovieListUrl(list)}>{list.badgeLabel}</Link>
            {list.rank != null && (
              <span className={styles.rank}>#{list.rank}</span>
            )}
          </>
        )}
      />
    </div>
  );
}

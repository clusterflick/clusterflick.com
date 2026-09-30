import { useMemo } from "react";
import {
  FilterId,
  PROGRAMME_GROUPS,
  getProgrammeName,
  type ProgrammeFilterId,
} from "@/lib/filters";
import { useFilterConfig } from "@/state/filter-config-context";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { getFestivalUrl } from "@/utils/get-festival-url";
import type { ScopeBannerItem } from "@/components/scope-banner";

const PAGE_URL: Record<
  ProgrammeFilterId,
  (programme: { id: string }) => string
> = {
  [FilterId.FilmClubs]: getFilmClubUrl,
  [FilterId.Festivals]: getFestivalUrl,
};

/**
 * The film clubs and festivals the grid is narrowed to, as `ScopeBanner`
 * items. Ids the registry no longer holds are left out, as the overlay leaves
 * them out of its chips: there is nothing to name or link to.
 */
export function useProgrammeScope(): ScopeBannerItem[] {
  const { filterState, toggleProgramme } = useFilterConfig();
  const filmClubs = filterState[FilterId.FilmClubs];
  const festivals = filterState[FilterId.Festivals];

  return useMemo(() => {
    const selected: Record<ProgrammeFilterId, string[] | null> = {
      [FilterId.FilmClubs]: filmClubs,
      [FilterId.Festivals]: festivals,
    };
    return PROGRAMME_GROUPS.flatMap((group) =>
      (selected[group.filterId] ?? []).flatMap((id) => {
        const programme = group.programmes.find((p) => p.id === id);
        if (!programme) return [];
        return [
          {
            id,
            kind:
              group.singular.charAt(0).toUpperCase() + group.singular.slice(1),
            name: getProgrammeName(programme),
            href: PAGE_URL[group.filterId](programme),
            onRemove: () => toggleProgramme(group.filterId, id),
          },
        ];
      }),
    );
  }, [filmClubs, festivals, toggleProgramme]);
}

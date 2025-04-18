import {
  AccessibilityFeature,
  Category,
  Classification,
  Movie,
  type CinemaData,
  type Filters,
} from "@/types";
import type { ReactNode, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  startOfDay,
  endOfDay,
  addYears,
  endOfToday,
  startOfYesterday,
} from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";
import getMovieClassification from "@/utils/get-movie-classification";
import { safelyJsonStringify, safelyJsonParse } from "@/utils/json-handling";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- typescript, let's not fight
export const processingFunctions: Record<keyof Filters, any> = {
  searchTerm: {
    toUrl: (value: Filters["searchTerm"]) => encodeURIComponent(value),
    fromUrl: (value: string) => decodeURIComponent(value),
  },
  dateRange: {
    toUrl: (value: Filters["dateRange"]) =>
      safelyJsonStringify<Filters["dateRange"]>(value),
    fromUrl: (value: string) => safelyJsonParse<Filters["dateRange"]>(value),
  },
  yearRange: {
    toUrl: (value: Filters["yearRange"]) =>
      safelyJsonStringify<Filters["yearRange"]>(value),
    fromUrl: (value: string) => safelyJsonParse<Filters["yearRange"]>(value),
  },
  includeUnknownYears: {
    toUrl: (value: Filters["includeUnknownYears"]) =>
      value ? "true" : "false",
    fromUrl: (value: string) => value === "true",
  },
  seenRange: {
    toUrl: (value: Filters["seenRange"]) =>
      safelyJsonStringify<Filters["seenRange"]>(value),
    fromUrl: (value: string) => safelyJsonParse<Filters["seenRange"]>(value),
  },
  filteredCategories: {
    toUrl: (value: Filters["filteredCategories"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredAudienceRatings: {
    toUrl: (value: Filters["filteredAudienceRatings"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredCriticsRatings: {
    toUrl: (value: Filters["filteredCriticsRatings"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredPerformanceTimes: {
    toUrl: (value: Filters["filteredPerformanceTimes"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredVenues: {
    toUrl: (value: Filters["filteredVenues"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredMovies: {
    toUrl: (value: Filters["filteredMovies"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredClassifications: {
    toUrl: (value: Filters["filteredClassifications"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredGenres: {
    toUrl: (value: Filters["filteredGenres"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
  filteredAccessibilityFeatures: {
    toUrl: (value: Filters["filteredAccessibilityFeatures"]) =>
      Object.keys(value).sort().join(","),
    fromUrl: (value: string) =>
      value
        .split(",")
        .reduce(
          (mapping, id) => ({ ...mapping, [id.trim()]: true }),
          {} as Record<string, boolean>,
        ),
  },
};

const convertToFilterList = (
  data: CinemaData["genres"] | CinemaData["venues"] | CinemaData["movies"],
) =>
  Object.values(data).reduce(
    (mapped, { id }) => ({ ...mapped, [id]: true }),
    {} as Record<string, boolean>,
  );

const getClassificationOptions = (movies: Record<string, Movie>) => {
  return Object.values(movies).reduce(
    (classifications, movie) => ({
      ...classifications,
      [getMovieClassification(movie)]: true,
    }),
    {} as Record<Classification, boolean>,
  );
};

const FiltersContext = createContext<{
  filters: Filters;
  defaultFilters?: Filters;
  getYearRange: () => Filters["yearRange"];
  getSeenRange: () => Filters["seenRange"];
  setFilters: (
    value: SetStateAction<Filters>,
    options?: { resetParams?: boolean },
  ) => string;
}>({
  filters: {
    searchTerm: "",
    dateRange: { start: 0, end: 0 },
    yearRange: { min: Infinity, max: -Infinity },
    includeUnknownYears: true,
    seenRange: { start: 0, end: 0 },
    filteredCategories: {},
    filteredAudienceRatings: {},
    filteredCriticsRatings: {},
    filteredPerformanceTimes: {},
    filteredVenues: {},
    filteredMovies: {},
    filteredClassifications: {} as Record<Classification, boolean>,
    filteredGenres: {},
    filteredAccessibilityFeatures: {} as Record<AccessibilityFeature, boolean>,
  },
  defaultFilters: undefined,
  getYearRange: () => ({ min: Infinity, max: -Infinity }),
  getSeenRange: () => ({
    start: startOfYesterday().getTime(),
    end: endOfToday().getTime(),
  }),
  setFilters: () => "",
});

export const useFilters = () => useContext(FiltersContext);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const { data } = useCinemaData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getYearRange = useCallback(
    () =>
      data?.movies
        ? Object.values(data.movies).reduce(
            (maxMin, movie) => {
              if (!movie.year) return maxMin;
              const year = parseInt(movie.year, 10);
              return {
                max: Math.max(maxMin.max, year),
                min: Math.min(maxMin.min, year),
              };
            },
            { max: -Infinity, min: Infinity },
          )
        : { max: -Infinity, min: Infinity },
    [data?.movies],
  );

  const getSeenRange = useCallback(() => {
    if (!data?.movies)
      return {
        start: startOfYesterday().getTime(),
        end: endOfToday().getTime(),
      };
    const oldestSeen = Object.values(data.movies).reduce(
      (oldest, { showings }) => {
        const movieFirstSeen = Object.values(showings).reduce(
          (earliestTime, { seen }) => {
            if (!seen) return earliestTime;
            return seen < earliestTime ? seen : earliestTime;
          },
          Date.now(),
        );
        return movieFirstSeen < oldest ? movieFirstSeen : oldest;
      },
      Date.now(),
    );

    return {
      start: startOfDay(oldestSeen).getTime(),
      end: endOfToday().getTime(),
    };
  }, [data?.movies]);

  const defaultFilters = useMemo(() => {
    const filteredVenues = data?.venues ? convertToFilterList(data.venues) : {};
    const filteredMovies = data?.movies ? convertToFilterList(data.movies) : {};
    const filteredClassifications = data?.movies
      ? getClassificationOptions(data.movies)
      : ({} as Record<Classification, boolean>);
    const filteredAccessibilityFeatures = [
      ...Object.values(AccessibilityFeature),
      "none",
    ].reduce(
      (mapped, name) => ({ ...mapped, [name]: true }),
      {} as Record<string, boolean>,
    );
    const filteredGenres = data?.genres ? convertToFilterList(data.genres) : {};
    const yearRange = getYearRange();
    const dateRange = {
      start: startOfDay(Date.now()).getTime(),
      end: endOfDay(addYears(Date.now(), 1)).getTime(),
    };
    const seenRange = getSeenRange();
    const filteredCategories = Object.values(Category).reduce(
      (mapping, category) => ({ ...mapping, [category]: true }),
      {},
    );
    const filteredAudienceRatings = {
      none: true,
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
    };
    const filteredCriticsRatings = {
      none: true,
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
      8: true,
      9: true,
      10: true,
    };
    const filteredPerformanceTimes = {
      0: true,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
      7: true,
      8: true,
      9: true,
      10: true,
      11: true,
      12: true,
      13: true,
      14: true,
      15: true,
      16: true,
      17: true,
      18: true,
      19: true,
      20: true,
      21: true,
      22: true,
      23: true,
    };

    return {
      searchTerm: "",
      dateRange,
      yearRange,
      includeUnknownYears: true,
      seenRange,
      filteredCategories,
      filteredAudienceRatings,
      filteredCriticsRatings,
      filteredPerformanceTimes,
      filteredVenues,
      filteredMovies,
      filteredClassifications,
      filteredAccessibilityFeatures,
      filteredGenres,
    };
  }, [data?.genres, data?.venues, data?.movies, getYearRange, getSeenRange]);

  const getUrlFilters = () => {
    const urlFilters = {} as Filters;

    const searchTerm = searchParams.get("searchTerm");
    if (searchTerm) {
      urlFilters.searchTerm =
        processingFunctions.searchTerm.fromUrl(searchTerm);
    }

    const dateRange = searchParams.get("dateRange");
    if (dateRange) {
      const dateRangeFromUrl = processingFunctions.dateRange.fromUrl(dateRange);
      if (dateRangeFromUrl) urlFilters.dateRange = dateRangeFromUrl;
    }

    const yearRange = searchParams.get("yearRange");
    if (yearRange) {
      const yearRangeFromUrl = processingFunctions.yearRange.fromUrl(yearRange);
      if (yearRangeFromUrl) urlFilters.yearRange = yearRangeFromUrl;
    }

    const includeUnknownYears = searchParams.get("includeUnknownYears");
    if (includeUnknownYears) {
      urlFilters.includeUnknownYears =
        processingFunctions.includeUnknownYears.fromUrl(includeUnknownYears);
    }

    const seenRange = searchParams.get("seenRange");
    if (seenRange) {
      urlFilters.seenRange = processingFunctions.seenRange.fromUrl(seenRange);
    }

    const filteredCategories = searchParams.get("filteredCategories");
    if (filteredCategories) {
      urlFilters.filteredCategories =
        processingFunctions.filteredCategories.fromUrl(filteredCategories);
    }

    const filteredAudienceRatings = searchParams.get("filteredAudienceRatings");
    if (filteredAudienceRatings) {
      urlFilters.filteredAudienceRatings =
        processingFunctions.filteredAudienceRatings.fromUrl(
          filteredAudienceRatings,
        );
    }

    const filteredCriticsRatings = searchParams.get("filteredCriticsRatings");
    if (filteredCriticsRatings) {
      urlFilters.filteredCriticsRatings =
        processingFunctions.filteredCriticsRatings.fromUrl(
          filteredCriticsRatings,
        );
    }

    const filteredPerformanceTimes = searchParams.get(
      "filteredPerformanceTimes",
    );
    if (filteredPerformanceTimes) {
      urlFilters.filteredPerformanceTimes =
        processingFunctions.filteredPerformanceTimes.fromUrl(
          filteredPerformanceTimes,
        );
    }

    const filteredVenues = searchParams.get("filteredVenues");
    if (filteredVenues) {
      urlFilters.filteredVenues =
        processingFunctions.filteredVenues.fromUrl(filteredVenues);
    }

    const filteredMovies = searchParams.get("filteredMovies");
    if (filteredMovies) {
      urlFilters.filteredMovies =
        processingFunctions.filteredMovies.fromUrl(filteredMovies);
    }

    const filteredClassifications = searchParams.get("filteredClassifications");
    if (filteredClassifications) {
      urlFilters.filteredClassifications =
        processingFunctions.filteredClassifications.fromUrl(
          filteredClassifications,
        );
    }

    const filteredAccessibilityFeatures = searchParams.get(
      "filteredAccessibilityFeatures",
    );
    if (filteredAccessibilityFeatures) {
      urlFilters.filteredAccessibilityFeatures =
        processingFunctions.filteredAccessibilityFeatures.fromUrl(
          filteredAccessibilityFeatures,
        );
    }

    const filteredGenres = searchParams.get("filteredGenres");
    if (filteredGenres) {
      urlFilters.filteredGenres =
        processingFunctions.filteredGenres.fromUrl(filteredGenres);
    }

    return urlFilters;
  };

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    ...getUrlFilters(),
  });

  const setFiltersAndUpdateUrl = (
    value: SetStateAction<Filters>,
    options: { resetParams?: boolean } = {},
  ): string => {
    const existingFilters = filters;
    const updatedFilters = value as Filters;

    const params = new URLSearchParams(
      options.resetParams ? "" : searchParams.toString(),
    );
    Object.keys(defaultFilters).forEach((key) => {
      const property = key as keyof Filters;
      if (existingFilters[property] !== updatedFilters[property]) {
        const value = processingFunctions[property].toUrl(
          updatedFilters[property],
        );
        const defaultValue = processingFunctions[property].toUrl(
          defaultFilters[property],
        );
        if (value && value !== defaultValue) {
          params.set(property, value);
        } else {
          params.delete(property);
        }
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    setFilters(value);
    return params.toString();
  };

  return (
    <FiltersContext.Provider
      value={{
        filters,
        defaultFilters,
        getYearRange,
        getSeenRange,
        setFilters: setFiltersAndUpdateUrl,
      }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

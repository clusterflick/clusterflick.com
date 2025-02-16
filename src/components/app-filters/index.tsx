import { AccessibilityFeature, Classification, type Filters } from "@/types";
import Accordion from "rsuite/cjs/Accordion";
import Checkbox from "rsuite/cjs/Checkbox";
import Divider from "rsuite/cjs/Divider";
import RangeSlider from "rsuite/cjs/RangeSlider";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import useMediaQuery from "rsuite/cjs/useMediaQuery";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import ResponsiveStack from "@/components/responsive-stack";
import Search from "@/components/search";
import DateRangePicker from "@/components/date-range";
import VenueFilter from "@/components/venue-filter";
import MovieFilter from "@/components/movie-filter";
import ClassificationFilter from "@/components/classification-filter";
import GenreFilter from "@/components/genre-filter";
import AccessibilityFeatureFilter from "@/components/accessibility-feature-filter";

export default function AppFilters() {
  const [isDesktop] = useMediaQuery(["lg"]);
  const { data } = useCinemaData();
  const { filters, defaultFilters, setFilters, getYearRange } = useFilters();

  const {
    filteredVenues,
    filteredMovies,
    filteredClassifications,
    filteredGenres,
    filteredAccessibilityFeatures,
    searchTerm,
    dateRange,
    yearRange,
    includeUnknownYears,
  } = filters;
  const setFilteredVenues = (filteredVenues: Filters["filteredVenues"]) =>
    setFilters({ ...filters, filteredVenues });
  const setFilteredMovies = (filteredMovies: Filters["filteredMovies"]) =>
    setFilters({ ...filters, filteredMovies });
  const setFilteredClassifications = (
    filteredClassifications: Filters["filteredClassifications"],
  ) => setFilters({ ...filters, filteredClassifications });
  const setFilteredGenres = (filteredGenres: Filters["filteredGenres"]) =>
    setFilters({ ...filters, filteredGenres });
  const setFilteredAccessibilityFeatures = (
    filteredAccessibilityFeatures: Filters["filteredAccessibilityFeatures"],
  ) => setFilters({ ...filters, filteredAccessibilityFeatures });
  const setSearchTerm = (searchTerm: Filters["searchTerm"]) =>
    setFilters({ ...filters, searchTerm });
  const setDateRange = (dateRange: Filters["dateRange"]) =>
    setFilters({ ...filters, dateRange });
  const setYearRange = (yearRange: Filters["yearRange"]) =>
    setFilters({ ...filters, yearRange });
  const setIncludeUnknownYears = (
    includeUnknownYears: Filters["includeUnknownYears"],
  ) => setFilters({ ...filters, includeUnknownYears });

  return (
    <>
      <Search value={searchTerm} onChange={setSearchTerm} />
      <Accordion>
        <Accordion.Panel header="More filters" style={{ padding: 0 }}>
          <Divider style={{ marginTop: 10, marginBottom: 20 }}>
            Performance Filters
          </Divider>
          <Stack direction="column" spacing={18}>
            <Stack.Item style={{ width: "100%" }}>
              <ResponsiveStack>
                <VenueFilter
                  venues={data!.venues}
                  values={filteredVenues}
                  onChange={setFilteredVenues}
                />
                <AccessibilityFeatureFilter
                  accessibilityFeatures={
                    Object.keys(
                      defaultFilters!.filteredAccessibilityFeatures,
                    ) as AccessibilityFeature[]
                  }
                  values={filteredAccessibilityFeatures}
                  onChange={setFilteredAccessibilityFeatures}
                />
              </ResponsiveStack>
            </Stack.Item>
            <Stack.Item style={{ width: "100%" }}>
              <ResponsiveStack>
                <DateRangePicker
                  value={dateRange}
                  defaultValue={defaultFilters?.dateRange}
                  onChange={setDateRange}
                />
                <></>
              </ResponsiveStack>
            </Stack.Item>
          </Stack>
          <Divider style={{ marginBottom: 20 }}>Movie Filters</Divider>
          <Stack direction="column" spacing={18}>
            <Stack.Item style={{ width: "100%" }}>
              <ResponsiveStack>
                <MovieFilter
                  movies={data!.movies}
                  values={filteredMovies}
                  onChange={setFilteredMovies}
                />
                <Stack direction={isDesktop ? "column" : "row"} spacing={8}>
                  <Stack.Item style={isDesktop ? { width: "100%" } : {}}>
                    <Text weight="bold" style={{ display: "inline" }}>
                      Years:
                    </Text>{" "}
                    &mdash;&mdash;
                    <Checkbox
                      checked={includeUnknownYears}
                      onChange={(value, checked) => {
                        setIncludeUnknownYears(checked);
                      }}
                    >
                      Include&nbsp;unknown
                    </Checkbox>
                  </Stack.Item>
                  <Stack.Item
                    style={{
                      width: "100%",
                      paddingLeft: "1rem",
                      paddingRight: "1rem",
                    }}
                  >
                    <RangeSlider
                      {...getYearRange()}
                      value={[yearRange.min, yearRange.max]}
                      onChange={([min, max]) => {
                        setYearRange({ min, max });
                      }}
                    />
                  </Stack.Item>
                </Stack>
              </ResponsiveStack>
            </Stack.Item>
            <Stack.Item style={{ width: "100%" }}>
              <ResponsiveStack>
                <ClassificationFilter
                  classifications={
                    Object.keys(
                      defaultFilters!.filteredClassifications,
                    ) as Classification[]
                  }
                  values={filteredClassifications}
                  onChange={setFilteredClassifications}
                />
                <GenreFilter
                  genres={data!.genres}
                  values={filteredGenres}
                  onChange={setFilteredGenres}
                />
              </ResponsiveStack>
            </Stack.Item>
          </Stack>
        </Accordion.Panel>
      </Accordion>
    </>
  );
}

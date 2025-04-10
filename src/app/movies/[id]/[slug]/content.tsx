"use client";
import { Classification } from "@/types";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { intervalToDuration, formatDuration } from "date-fns";
import Container from "rsuite/cjs/Container";
import Heading from "rsuite/cjs/Heading";
import TagGroup from "rsuite/cjs/TagGroup";
import Tag from "rsuite/cjs/Tag";
import Card from "rsuite/cjs/Card";
import Stack from "rsuite/cjs/Stack";
import Toggle from "rsuite/cjs/Toggle";
import Text from "rsuite/cjs/Text";
import useMediaQuery from "rsuite/cjs/useMediaQuery";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import getMovieClassification from "@/utils/get-movie-classification";
import getMatchingMovies from "@/utils/get-matching-movies";
import showNumber from "@/utils/show-number";
import MoviePoster from "@/components/movie-poster";
import MovieClassification from "@/components/movie-classification";
import PerformanceList from "@/components/performance-list";
import AppHeading from "@/components/app-heading";
import FavouriteMovieButton from "@/components/favourite-movie-button";
import "./index.scss";

export default function MoviePageContent({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const [isShowingAllPerformances, setIsShowingAllPerformances] =
    useState(false);
  const { id } = use(params);
  const router = useRouter();
  const { data } = useCinemaData();
  const { filters } = useFilters();
  const [isDesktop] = useMediaQuery(["lg"]);

  const matchingMovies = getMatchingMovies(data!.movies, filters);
  const movieAllPerformances = data?.movies[id];
  const movie = matchingMovies.find((movie) => movie.id === id);
  const displayedMovie = movie || movieAllPerformances;

  useEffect(() => {
    if (!movieAllPerformances || !displayedMovie) {
      router.push("/");
    }
  }, [router, movieAllPerformances, displayedMovie]);

  if (!movieAllPerformances || !displayedMovie) {
    return null;
  }

  const isFilterApplied =
    movie?.performances.length !== movieAllPerformances.performances.length;
  const duration =
    displayedMovie.duration ||
    displayedMovie.showings[Object.keys(displayedMovie.showings)[0]].overview
      .duration;
  const now = Date.now();
  const dateDuration = intervalToDuration({
    start: new Date(now),
    end: new Date(now + duration),
  });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["hours", "minutes"],
  });

  const venueTags = Array.from(
    Object.values(displayedMovie.showings).reduce(
      (unique, { venueId }) => unique.add(venueId),
      new Set<string>(),
    ),
  )
    .map((venueId) => data!.venues[venueId])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ id, name }) => (
      <Tag key={id} size="md">
        {name}
      </Tag>
    ));

  const classification = getMovieClassification(displayedMovie);

  return (
    <Container>
      <AppHeading />
      <Container style={{ padding: "2rem" }}>
        <Stack spacing={42} direction="column" alignItems="flex-start">
          <Stack.Item style={{ width: "100%" }}>
            <Card shaded direction="row">
              {isDesktop ? (
                <MoviePoster
                  movie={displayedMovie}
                  width={250}
                  height={375}
                  hideShadow
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "0.7rem",
                      left: "0.7rem",
                    }}
                  >
                    <FavouriteMovieButton movie={displayedMovie} show />
                  </div>
                </MoviePoster>
              ) : null}
              <Card.Body style={{ width: "100%" }}>
                <Stack
                  spacing={12}
                  direction="column"
                  alignItems="flex-start"
                  style={{ width: "100%" }}
                >
                  <Stack.Item>
                    <Stack
                      direction="row"
                      spacing={"0.75rem"}
                      alignItems="flex-start"
                    >
                      {classification &&
                      classification !== Classification.Unknown ? (
                        <Stack.Item style={{ paddingTop: "0.5rem" }}>
                          <MovieClassification
                            classification={classification}
                          />
                        </Stack.Item>
                      ) : null}
                      <Stack.Item>
                        <Heading level={2}>
                          {displayedMovie.title}
                          {displayedMovie.year ? (
                            <>
                              {" "}
                              <span style={{ color: "#999" }}>
                                ({displayedMovie.year})
                              </span>
                            </>
                          ) : null}
                        </Heading>
                      </Stack.Item>
                    </Stack>
                  </Stack.Item>
                  {displayedMovie.overview ? (
                    <Stack.Item>
                      <Text as="em">{displayedMovie.overview}</Text>
                    </Stack.Item>
                  ) : null}
                  <Stack.Item style={{ width: "100%" }}>
                    <Stack direction="column" alignItems="flex-start">
                      {!isDesktop ? (
                        <Stack.Item
                          style={{ margin: "0.5rem auto 1.5rem auto" }}
                        >
                          <MoviePoster
                            movie={displayedMovie}
                            width={250}
                            height={375}
                            hideShadow
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "0.7rem",
                                left: "0.7rem",
                              }}
                            >
                              <FavouriteMovieButton
                                movie={displayedMovie}
                                show
                              />
                            </div>
                          </MoviePoster>
                        </Stack.Item>
                      ) : null}
                      {duration ? (
                        <Stack.Item style={{ marginBottom: "1rem" }}>
                          <Text>
                            <strong>Duration:</strong> {formattedDuration}
                          </Text>
                        </Stack.Item>
                      ) : null}
                      <Stack.Item style={{ width: "100%", overflow: "hidden" }}>
                        <details
                          className="movie-venues"
                          style={{ display: "inline-block" }}
                        >
                          <summary
                            style={{
                              whiteSpace: "nowrap",
                              width: "15rem",
                              display: "inline-block",
                              cursor: "pointer",
                              lineHeight: "24px",
                            }}
                          >
                            <strong>Venues:</strong> ({venueTags.length}){" "}
                            <div className="movie-venues-preview">
                              {venueTags}
                            </div>
                            <div className="movie-venues-hide-control">
                              <Tag color="blue" size="sm">
                                Hide venue list
                              </Tag>
                            </div>
                          </summary>
                          <TagGroup style={{ margin: "0" }}>
                            {venueTags}
                          </TagGroup>
                        </details>
                        <span className="venue-fade-out" />
                      </Stack.Item>

                      {displayedMovie.genres &&
                      displayedMovie.genres.length > 0 ? (
                        <Stack.Item>
                          <TagGroup style={{ margin: "0" }}>
                            <strong>Genres:</strong>{" "}
                            {Object.values(displayedMovie.genres)
                              .map((id) => data!.genres[id])
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(({ id, name }) => (
                                <Tag key={id} size="md">
                                  {name}
                                </Tag>
                              ))}
                          </TagGroup>
                        </Stack.Item>
                      ) : null}
                      {displayedMovie.directors &&
                      displayedMovie.directors.length > 0 ? (
                        <Stack.Item>
                          <TagGroup style={{ margin: "0" }}>
                            <strong>Directed by:</strong>{" "}
                            {Object.values(displayedMovie.directors)
                              .map((id) => data!.people[id])
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(({ id, name }) => (
                                <Tag key={id} size="md">
                                  {name}
                                </Tag>
                              ))}
                          </TagGroup>
                        </Stack.Item>
                      ) : null}
                      {displayedMovie.actors &&
                      displayedMovie.actors.length > 0 ? (
                        <Stack.Item>
                          <TagGroup style={{ margin: "0" }}>
                            <strong>Starring:</strong>{" "}
                            {Array.from(
                              new Set(Object.values(displayedMovie.actors)),
                            )
                              .map((id) => data!.people[id])
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(({ id, name }) => (
                                <Tag key={id} size="md">
                                  {name}
                                </Tag>
                              ))}
                          </TagGroup>
                        </Stack.Item>
                      ) : null}
                      <Stack.Item style={{ marginTop: "0.75rem" }}>
                        <strong>Links:</strong> &nbsp;&nbsp;&nbsp;
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            display: "inline-flex",
                            columnGap: "1.5rem",
                            rowGap: "0.5rem",
                            whiteSpace: "nowrap",
                            flexWrap: "wrap",
                          }}
                        >
                          {displayedMovie.isUnmatched ? (
                            <li>
                              <a
                                href={`https://www.themoviedb.org/search?query=${encodeURIComponent(displayedMovie.normalizedTitle)}`}
                                target="_blank"
                                rel="noopener"
                              >
                                🔍 Search TheMovieDB
                              </a>
                            </li>
                          ) : null}
                          {displayedMovie.isUnmatched ? null : (
                            <li>
                              <a
                                href={`https://www.themoviedb.org/movie/${displayedMovie.id}`}
                                target="_blank"
                                rel="noopener"
                              >
                                🎬 TheMovieDB
                              </a>
                            </li>
                          )}
                          {displayedMovie.imdbId ? (
                            <li>
                              <a
                                href={`https://www.imdb.com/title/${displayedMovie.imdbId}`}
                                target="_blank"
                                rel="noopener"
                              >
                                🗂️ IMDb
                              </a>
                            </li>
                          ) : null}
                          {displayedMovie.youtubeTrailer ? (
                            <li>
                              <a
                                href={`https://www.youtube.com/watch?v=${displayedMovie.youtubeTrailer}`}
                                target="_blank"
                                rel="noopener"
                              >
                                🎞️ Trailer on YouTube
                              </a>
                            </li>
                          ) : null}
                        </ul>
                      </Stack.Item>
                      {displayedMovie.rottenTomatoes &&
                      (displayedMovie.rottenTomatoes.audience.all.score ||
                        displayedMovie.rottenTomatoes.critics.all.score) ? (
                        <Stack.Item style={{ display: "flex" }}>
                          <strong>Rating:</strong> &nbsp;&nbsp;
                          <div style={{ display: "flex", gap: "2rem" }}>
                            {displayedMovie.rottenTomatoes.critics.all.score ? (
                              <div>
                                🍅{" "}
                                <strong>
                                  {
                                    displayedMovie.rottenTomatoes.critics.all
                                      .score
                                  }
                                  %
                                </strong>{" "}
                                of the critics liked it
                                {displayedMovie.rottenTomatoes.critics.all
                                  .rating ? (
                                  <>
                                    , scoring{" "}
                                    <strong>
                                      {
                                        displayedMovie.rottenTomatoes.critics
                                          .all.rating
                                      }
                                    </strong>{" "}
                                    / 10
                                  </>
                                ) : (
                                  ""
                                )}
                              </div>
                            ) : null}
                            {displayedMovie.rottenTomatoes.audience.all
                              .score ? (
                              <div>
                                🍿{" "}
                                <strong>
                                  {
                                    displayedMovie.rottenTomatoes.audience.all
                                      .score
                                  }
                                  %
                                </strong>{" "}
                                of the audience liked it
                                {displayedMovie.rottenTomatoes.audience.all
                                  .rating ? (
                                  <>
                                    , scoring{" "}
                                    <strong>
                                      {
                                        displayedMovie.rottenTomatoes.audience
                                          .all.rating
                                      }
                                    </strong>{" "}
                                    / 5
                                  </>
                                ) : (
                                  ""
                                )}
                              </div>
                            ) : null}
                          </div>
                        </Stack.Item>
                      ) : null}
                    </Stack>
                  </Stack.Item>
                </Stack>
              </Card.Body>
            </Card>
          </Stack.Item>
          <Stack.Item style={{ width: "100%" }}>
            <Heading level={3}>
              Performances{" "}
              <Tag
                size="lg"
                style={{
                  backgroundColor: "var(--rs-yellow-100)",
                  border: "1px solid var(--rs-yellow-200)",
                }}
              >
                {showNumber(
                  (isShowingAllPerformances ? movieAllPerformances : movie)
                    ?.performances.length || 0,
                )}
              </Tag>
              {isFilterApplied ? (
                <>
                  &nbsp;
                  <Toggle
                    checkedChildren={<>&nbsp;Filters Applied&nbsp;</>}
                    unCheckedChildren={<>&nbsp;Filters Removed&nbsp;</>}
                    checked={!isShowingAllPerformances}
                    onChange={(value) => setIsShowingAllPerformances(!value)}
                  />
                </>
              ) : null}
            </Heading>
            <PerformanceList
              movie={isShowingAllPerformances ? movieAllPerformances : movie}
            />
          </Stack.Item>
        </Stack>
      </Container>
    </Container>
  );
}

"use client";
import { FavouriteMovie, Movie, MoviePerformance } from "@/types";
import { useState } from "react";
import Link from "next/link";
import { Octokit } from "octokit";
import { isAfter } from "date-fns";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Heading from "rsuite/cjs/Heading";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import Modal from "rsuite/cjs/Modal";
import Input from "rsuite/cjs/Input";
import Button from "rsuite/cjs/Button";
import InputGroup from "rsuite/cjs/InputGroup";
import WarningRoundIcon from "@rsuite/icons/WarningRound";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserSettings } from "@/state/user-settings-context";
import {
  getAuthToken,
  getGithubGistId,
  removeAuthToken,
  removeGithubGistId,
  setAuthToken,
  syncWithPersistedUserSettings,
} from "@/state/user-settings-persistence";
import getMoviePath from "@/utils/get-movie-path";
import showNumber from "@/utils/show-number";
import AppHeading from "@/components/app-heading";
import bestMoviesFilter from "@/components/app-heading/best-movies-filter";
import showTimeToNextPerformance from "@/components/movie-item/show-time-to-next-performance";
import ExternalLink from "@/components/external-link";
import FavouriteMovieButton from "@/components/favourite-movie-button";
import FilterLink from "@/components/filter-link";

function sortByTitle<T extends Omit<FavouriteMovie, "addedOn">>(
  list: T[],
): T[] {
  return list.sort((a, b) => a.title.localeCompare(b.title));
}

function filterForFuturePerformances(
  performances: MoviePerformance[],
): MoviePerformance[] {
  return performances
    .filter(({ time }) => isAfter(time, new Date()))
    .sort((a, b) => a.time - b.time);
}

async function validateAndStoreToken(auth: string): Promise<boolean> {
  const octokit = new Octokit({ auth });
  let isValid = false;
  try {
    const gistList = await octokit.rest.gists.list();
    isValid = Array.isArray(gistList.data);
  } catch (e) {
    console.log("Error validating token", e);
  }
  if (isValid) setAuthToken(auth);
  return isValid;
}

export default function FavouritesContent() {
  const { data } = useCinemaData();
  const { favouriteMovies, setFavouriteMovies } = useUserSettings();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [token, setToken] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const gistId = getGithubGistId();
  const authToken = getAuthToken();
  const isSyncing = gistId && authToken;

  const matchedMovies = Object.values(data!.movies).filter(
    ({ isUnmatched }) => !isUnmatched,
  );
  const randomIndex = Math.floor(Math.random() * matchedMovies.length);
  const randomMovie = matchedMovies[randomIndex];

  const { availableMovies, unavailableMovies } = favouriteMovies.reduce(
    (movieGroups, movie) => {
      const movieMatch = data!.movies[movie.id];
      if (movieMatch) {
        if (filterForFuturePerformances(movieMatch.performances).length > 0) {
          movieGroups.availableMovies.push(movieMatch);
        } else {
          movieGroups.unavailableMovies.push(movie);
        }
      } else {
        movieGroups.unavailableMovies.push(movie);
      }
      return movieGroups;
    },
    {
      availableMovies: [] as Movie[],
      unavailableMovies: [] as FavouriteMovie[],
    },
  );

  return (
    <Container>
      <AppHeading />
      <Content style={{ padding: "1rem" }}>
        <Modal
          keyboard={false}
          open={showSyncModal}
          onClose={() => {
            setShowSyncModal(false);
          }}
        >
          <Modal.Header>
            <Modal.Title>
              {isSyncing ? "Manage" : "Setup"} Favourites Sync
            </Modal.Title>
          </Modal.Header>
          {isSyncing ? (
            <Modal.Body>
              <Stack direction="column" alignItems="flex-start" spacing="1rem">
                <Stack.Item>
                  <Text>
                    Sync is active and linked to{" "}
                    <ExternalLink
                      href={`https://api.github.com/gists/${gistId}`}
                    >
                      a Gist on your Github account
                    </ExternalLink>
                    .
                  </Text>
                  <Text>
                    You can use the button below to stop syncing favourites on
                    this device.
                  </Text>
                </Stack.Item>
                <Stack.Item>
                  <Text>
                    ℹ️ Please note that this will not delete the Gist on your
                    Github account, and will only remove the{" "}
                    <em>Personal Access Token</em> provided when sync was set
                    up.
                  </Text>
                </Stack.Item>
                <Stack.Item>
                  <Button
                    appearance="primary"
                    color="red"
                    onClick={() => {
                      removeAuthToken();
                      removeGithubGistId();
                      setShowSyncModal(false);
                      setToken("");
                    }}
                  >
                    <WarningRoundIcon />
                    &nbsp; Deactivate Sync
                  </Button>
                </Stack.Item>
              </Stack>
            </Modal.Body>
          ) : (
            <Modal.Body>
              Sync is powered using{" "}
              <ExternalLink href="https://gist.github.com/">
                Github Gists
              </ExternalLink>
              . To set this up:
              <ol>
                <li>
                  You need to have a Github account:{" "}
                  <ExternalLink href="https://github.com/signup">
                    <span style={{ whiteSpace: "nowrap" }}>
                      https://github.com/signup
                    </span>
                  </ExternalLink>
                </li>
                <li>
                  Create a <em>fine-grained personal access token</em>:{" "}
                  <ExternalLink href="https://github.com/settings/personal-access-tokens">
                    <span style={{ whiteSpace: "nowrap" }}>
                      https://github.com/settings/personal-access-tokens
                    </span>
                  </ExternalLink>
                  <ul>
                    <li>
                      Set the token to have{" "}
                      <em>&quot;Read and Write access to gists&quot;</em>{" "}
                      &mdash; no other permissions are required.
                    </li>
                    <li>Set the token have no expiry date.</li>
                  </ul>
                </li>
                <li>
                  Enter your personal access token below; it will be stored on
                  your device and used to read and write a gist on your account.
                </li>
              </ol>
              <br />
              <Stack spacing="0.5rem">
                <Stack.Item grow={1}>
                  <InputGroup>
                    <InputGroup.Addon>Token:</InputGroup.Addon>
                    <Input
                      placeholder={`github_pat_${Array(82).join("x")}`}
                      value={token}
                      onChange={setToken}
                    />
                  </InputGroup>
                </Stack.Item>
                <Stack.Item>
                  <Button
                    loading={isValidating}
                    appearance="primary"
                    onClick={async () => {
                      setIsValidating(true);
                      const isValid = await validateAndStoreToken(token);
                      if (!isValid) return setIsValidating(false);
                      syncWithPersistedUserSettings(
                        ({ favouriteMovies }) => {
                          setFavouriteMovies(favouriteMovies || []);
                        },
                        () => {
                          setIsValidating(false);
                          setShowSyncModal(false);
                        },
                      );
                    }}
                  >
                    Setup Sync
                  </Button>
                </Stack.Item>
              </Stack>
            </Modal.Body>
          )}
        </Modal>
        <Stack spacing={18} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>Favourites</Heading>
            {isSyncing ? (
              <Text>
                ✅ Your favourites are syncing.{" "}
                <Button
                  appearance="link"
                  style={{ padding: 0, verticalAlign: "bottom" }}
                  onClick={() => setShowSyncModal(true)}
                >
                  Change settings?
                </Button>
              </Text>
            ) : (
              <Text>
                Your favourites are stored in your browser. 🔄{" "}
                <Button
                  appearance="link"
                  style={{ padding: 0, verticalAlign: "bottom" }}
                  onClick={() => setShowSyncModal(true)}
                >
                  Setup sync
                </Button>{" "}
                to share them with another device.
              </Text>
            )}
          </Stack.Item>
          {favouriteMovies.length === 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>No Movies Favourited</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  You haven&apos;t favourited any movies, so there&apos;s
                  nothing to see here! 🙈
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  <strong>Want some inspiration?</strong>
                </Text>
                <ul>
                  <li>
                    Take a look at the{" "}
                    <FilterLink filters={{ filteredMovies: bestMoviesFilter }}>
                      🍅 Best Movies
                    </FilterLink>{" "}
                    which filters for any movie from the Rotten Tomatoes{" "}
                    <ExternalLink href="https://editorial.rottentomatoes.com/guide/best-movies-of-all-time/">
                      300 Best Movies of All Time
                    </ExternalLink>
                    .
                  </li>
                  <li>
                    Or{" "}
                    <Link href={getMoviePath(randomMovie)}>
                      try your luck with a randomly selected movie
                    </Link>
                    !
                  </li>
                </ul>
              </Stack.Item>
            </>
          ) : null}
          {availableMovies.length > 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>Movie Opportunities 🎉</Heading>
              </Stack.Item>
              <Stack.Item>
                <ol>
                  {sortByTitle<Movie>(availableMovies).map((movie) => {
                    const performances = filterForFuturePerformances(
                      movie.performances,
                    );

                    return (
                      <li key={movie.id}>
                        <FavouriteMovieButton
                          style={{ marginTop: "-2px" }}
                          movie={movie}
                          small
                        />
                        &nbsp;{" "}
                        <Link href={getMoviePath(movie)}>
                          {movie.title} {movie.year ? `(${movie.year})` : ""}
                        </Link>
                        <ul>
                          <li>
                            {performances.length === 1
                              ? `${performances.length} performance remaining`
                              : `${showNumber(performances.length)} performances remaining`}{" "}
                            &mdash;{" "}
                            {showTimeToNextPerformance(
                              performances,
                            ).toLowerCase()}
                          </li>
                        </ul>
                      </li>
                    );
                  })}
                </ol>
              </Stack.Item>
            </>
          ) : null}
          {unavailableMovies.length > 0 ? (
            <>
              <Stack.Item>
                <Heading level={4}>Missed Movies 😱</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  The following movies no longer have performances. You can
                  remove them below, or keep them in case this movie is added
                  again in the future.
                </Text>
              </Stack.Item>
              <Stack.Item>
                <ol>
                  {sortByTitle<FavouriteMovie>(unavailableMovies).map(
                    (movie) => {
                      const isMovieDb = /^\d+$/.test(movie.id);
                      return (
                        <li key={movie.id}>
                          <FavouriteMovieButton
                            style={{ marginTop: "-2px" }}
                            movie={movie}
                            small
                          />
                          &nbsp; {movie.title}{" "}
                          {movie.year ? `(${movie.year})` : ""}
                          {isMovieDb ? (
                            <>
                              {" "}
                              &mdash;{" "}
                              <ExternalLink
                                href={`https://www.themoviedb.org/movie/${movie.id}`}
                              >
                                🎬 TheMovieDB
                              </ExternalLink>
                            </>
                          ) : null}
                        </li>
                      );
                    },
                  )}
                </ol>
              </Stack.Item>
            </>
          ) : null}
        </Stack>
      </Content>
    </Container>
  );
}

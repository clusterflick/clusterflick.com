"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCinemaData } from "@/state/cinema-data-context";
import getMovieUrlSegments from "@/utils/get-movie-url-segments";
import { Container, Heading, Stack, Text } from "rsuite";
import AppHeading from "@/components/app-heading";
import FilterLink from "@/components/filter-link";
import ExternalLink from "@/components/external-link";
import getMoviePath from "@/utils/get-movie-path";
import Link from "next/link";
import bestMoviesFilter from "@/components/app-heading/best-movies-filter";

export default function NotFoundPage() {
  const router = useRouter();
  const { data } = useCinemaData();

  const pathname = usePathname();
  const movieUrlMatch = pathname?.match(/^\/movies\/([^\/]+)\//);

  let movie = undefined;
  if (movieUrlMatch && data) {
    const id = movieUrlMatch[1];
    movie = data.movies[id];
  }

  const movies = Object.values(data!.movies);
  const randomIndex = Math.floor(Math.random() * movies.length);
  const randomMovie = movies[randomIndex];

  useEffect(() => {
    // If movie exists, redirect to correct URL
    if (movie) {
      const correctSegments = getMovieUrlSegments(movie);
      router.replace(`/movies/${correctSegments.id}/${correctSegments.slug}/`);
    }
  }, [router, movie]);

  if (movie) return null;

  return (
    <Container>
      <AppHeading />
      <Container style={{ padding: "2rem" }}>
        <Stack spacing={18} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading level={4}>Page not found! 🙈</Heading>
          </Stack.Item>
          <Stack.Item>
            <Text weight="bold">Want some inspiration?</Text>
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
        </Stack>
      </Container>
    </Container>
  );
}

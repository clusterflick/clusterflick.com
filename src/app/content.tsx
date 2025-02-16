"use client";
import { useDeferredValue } from "react";
import Head from "next/head";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import getMatchingMovies from "@/utils/get-matching-movies";
import AppHeading from "@/components/app-heading";
import AppFilters from "@/components/app-filters";
import Summary from "@/components/summary";
import MovieList from "@/components/movie-list";

export default function Home() {
  const { data } = useCinemaData();
  const { filters } = useFilters();
  const deferredFilters = useDeferredValue(filters);

  return (
    <Container>
      <Head>
        <title>London Cinema Movies</title>
      </Head>
      <AppHeading>
        <AppFilters />
      </AppHeading>
      <Content>
        <Summary movies={getMatchingMovies(data!.movies, filters)} />
        <MovieList filters={deferredFilters} />
      </Content>
    </Container>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { ButtonLink } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import StatusPage, { StatusPageLoading } from "@/components/status-page";
import slugify from "@sindresorhus/slugify";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const { movies, isLoading, getData } = useCinemaData();

  // The static 404 page is pre-rendered at build time with no knowledge of the
  // runtime URL. On hydration, usePathname() returns the real URL, which can
  // produce a different render tree (loading vs not-found). We defer pathname
  // reading until after mount so the initial client render matches the static HTML.
  const [hasMounted, setHasMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHasMounted(true), []);

  // Use refs to track state that shouldn't trigger re-renders
  const isRedirectingRef = useRef(false);

  const isWaitingForData = useMemo(
    () => isLoading || Object.keys(movies).length === 0,
    [isLoading, movies],
  );

  // Grab the piece of the URL after `/movies` which should be an ID
  const movieIdMatch = hasMounted
    ? pathname?.match(/^\/movies\/([^/]+)\/?/i)
    : null;
  const movieId = movieIdMatch?.[1];
  // Grab the piece of the URL after `/movies` which should be an ID and a slug
  // This will used as a fallback if the ID doesn't match any movies
  const movieSlugMatch = hasMounted
    ? pathname?.match(/^\/movies\/([^/]+)\/([^/]+)\/?/i)
    : null;
  const movieSlug = movieSlugMatch?.[2];

  // Compute derived state from movies data
  const movieCheckResult = useMemo(() => {
    if (!movieId || !movieSlug) {
      return { hasChecked: true, shouldRedirect: false, redirectUrl: null };
    }
    if (isWaitingForData) {
      return { hasChecked: false, shouldRedirect: false, redirectUrl: null };
    }
    const movieFromId = movies[movieId];
    if (movieFromId) {
      return {
        hasChecked: true,
        shouldRedirect: true,
        redirectUrl: `${getMovieUrl(movieFromId)}/`,
      };
    }
    const moviesFromSlug = Object.values(movies).filter(
      (movie) => slugify(movie.title) === movieSlug,
    );
    if (moviesFromSlug.length === 1) {
      return {
        hasChecked: true,
        shouldRedirect: true,
        redirectUrl: `${getMovieUrl(moviesFromSlug[0])}/`,
      };
    }
    return { hasChecked: true, shouldRedirect: false, redirectUrl: null };
  }, [movieId, movieSlug, movies, isWaitingForData]);

  // Fetch data if we have a movieId
  useEffect(() => {
    if (movieId) {
      getData();
    }
  }, [movieId, getData]);

  // Handle redirect when needed
  useEffect(() => {
    if (
      movieCheckResult.shouldRedirect &&
      movieCheckResult.redirectUrl &&
      !isRedirectingRef.current
    ) {
      isRedirectingRef.current = true;
      router.replace(movieCheckResult.redirectUrl);
    }
  }, [movieCheckResult, router]);

  // Show loading state while checking for redirect
  const showLoading =
    movieId &&
    (!movieCheckResult.hasChecked || movieCheckResult.shouldRedirect);

  if (showLoading) {
    return (
      <StatusPageLoading>
        <LoadingIndicator
          size="lg"
          message={
            movieCheckResult.shouldRedirect
              ? "Redirecting..."
              : "Looking for that film..."
          }
        />
      </StatusPageLoading>
    );
  }

  return (
    <StatusPage
      iconSrc="/images/icons/neon-ticket-ripped.svg"
      title="Show Not Found"
      message={
        <>
          We couldn&apos;t find that page.
          <br />
          It may have been moved or no longer exists.
        </>
      }
      backLink={{ url: "/", text: "Back to film list" }}
      actions={<ButtonLink href="/">Back to Film List</ButtonLink>}
    />
  );
}

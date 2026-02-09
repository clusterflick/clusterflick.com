"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { ButtonLink } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import StatusPage, { StatusPageLoading } from "@/components/status-page";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const { movies, isLoading, getData } = useCinemaData();

  // Use refs to track state that shouldn't trigger re-renders
  const isRedirectingRef = useRef(false);
  const hasCheckedRef = useRef(false);

  const isWaitingForData = useMemo(
    () => isLoading || Object.keys(movies).length === 0,
    [isLoading, movies],
  );

  // Grab the piece of the URL after `/movies` which should be an ID
  const movieMatch = pathname?.match(/^\/movies\/([^/]+)\/?/i);
  const movieId = movieMatch?.[1];

  // Compute derived state from movies data
  const movieCheckResult = useMemo(() => {
    if (!movieId) {
      return { hasChecked: true, shouldRedirect: false, redirectUrl: null };
    }
    if (isWaitingForData) {
      return { hasChecked: false, shouldRedirect: false, redirectUrl: null };
    }
    const movie = movies[movieId];
    if (movie) {
      return {
        hasChecked: true,
        shouldRedirect: true,
        redirectUrl: `${getMovieUrl(movie)}/`,
      };
    }
    return { hasChecked: true, shouldRedirect: false, redirectUrl: null };
  }, [movieId, movies, isWaitingForData]);

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
    if (movieCheckResult.hasChecked) {
      hasCheckedRef.current = true;
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

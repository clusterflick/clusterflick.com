"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { trackEvent } from "@/utils/track-event";
import { ButtonLink } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import StatusPage, { StatusPageLoading } from "@/components/status-page";
import slugify from "@sindresorhus/slugify";

function GenericNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-ticket-ripped.svg"
      title="Page Not Found"
      message="We couldn't find that page. It may have been moved or removed."
      backLink={{ url: "/films", text: "Back to film list" }}
      actions={<ButtonLink href="/films">Back to film list</ButtonLink>}
    />
  );
}

function FestivalNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-clapper.svg"
      title="Festival Not Found"
      message="We couldn't find that festival. It may have ended or the link may have changed."
      backLink={{ url: "/festivals/", text: "Back to festivals" }}
      actions={<ButtonLink href="/festivals/">Back to festivals</ButtonLink>}
    />
  );
}

function FilmClubNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-3d-glasses.svg"
      title="Film Club Not Found"
      message="We couldn't find that film club. It may have moved or the link may have changed."
      backLink={{ url: "/film-clubs/", text: "Back to film clubs" }}
      actions={<ButtonLink href="/film-clubs/">Back to film clubs</ButtonLink>}
    />
  );
}

/**
 * Collection pages come and go with the listings — a collection is published
 * only while two or more of its films are showing — so a dead link here is
 * usually a collection that has fallen quiet rather than a mistyped URL. The
 * message says so instead of implying the reader got it wrong.
 */
function CollectionNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-clapper.svg"
      title="Collection Not Found"
      message="We couldn't find that collection. Collections appear here while two or more of their films are showing, so it may have nothing on in London right now."
      backLink={{ url: "/collections/", text: "Back to collections" }}
      actions={
        <ButtonLink href="/collections/">Back to collections</ButtonLink>
      }
    />
  );
}

/**
 * Dated update pages are deliberately short-lived: they cover a window of
 * recent pipeline runs, and an update stops being worth reading once the
 * screenings it announced have been and gone. Feed items outlive that window —
 * readers keep them indefinitely — so this is mostly reached from an old item,
 * and says the page expired rather than implying a mistyped URL.
 */
function UpdateNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-clapper.svg"
      title="Update No Longer Available"
      message="We couldn't find that update. Updates cover the last couple of weeks of listings changes, so this one has probably rolled out of the window."
      backLink={{ url: "/updates/", text: "Back to updates" }}
      actions={<ButtonLink href="/updates/">See the latest updates</ButtonLink>}
    />
  );
}

function VenueNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-projector.svg"
      title="Cinema Not Found"
      message="We couldn't find that cinema. It may have closed or the link may have changed."
      backLink={{ url: "/london-cinemas/", text: "Back to London cinemas" }}
      actions={
        <ButtonLink href="/london-cinemas/">Back to London cinemas</ButtonLink>
      }
    />
  );
}

function MovieNotFound({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { movies, isLoading, getData } = useCinemaData();
  const isRedirectingRef = useRef(false);

  const isWaitingForData = useMemo(
    () => isLoading || Object.keys(movies).length === 0,
    [isLoading, movies],
  );

  // Grab the piece of the URL after `/movies` which should be an ID
  const movieIdMatch = pathname.match(/^\/movies\/([^/]+)\/?/i);
  const movieId = movieIdMatch?.[1];
  // Grab the piece of the URL after `/movies` which should be an ID and a slug.
  // Used as a fallback if the ID doesn't match any movies.
  const movieSlugMatch = pathname.match(/^\/movies\/([^/]+)\/([^/]+)\/?/i);
  const movieSlug = movieSlugMatch?.[2];

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

  useEffect(() => {
    if (movieId) getData();
  }, [movieId, getData]);

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

  if (!movieCheckResult.hasChecked || movieCheckResult.shouldRedirect) {
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
      title="Film Not Found"
      message="We couldn't find that film. It may no longer be showing or the link may have changed."
      backLink={{ url: "/films", text: "Back to film list" }}
      actions={<ButtonLink href="/films">Back to film list</ButtonLink>}
    />
  );
}

function getNotFoundType(pathname: string): string {
  if (/^\/movies\//i.test(pathname)) return "movie";
  if (/^\/festivals\//i.test(pathname)) return "festival";
  if (/^\/film-clubs\//i.test(pathname)) return "film-club";
  if (/^\/collections\//i.test(pathname)) return "collection";
  if (/^\/updates\//i.test(pathname)) return "update";
  if (/^\/(london-cinemas|venues)\//i.test(pathname)) return "venue";
  return "generic";
}

export default function NotFound() {
  const pathname = usePathname();

  // The static 404 page is pre-rendered at build time with no knowledge of the
  // runtime URL. On hydration, usePathname() returns the real URL, which can
  // produce a different render tree. We defer pathname reading until after mount
  // so the initial client render matches the static HTML.
  const [hasMounted, setHasMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHasMounted(true), []);

  const mountedPathname = hasMounted ? pathname : null;

  useEffect(() => {
    if (!mountedPathname) return;
    trackEvent("not-found", {
      type: getNotFoundType(mountedPathname),
      pathname: mountedPathname,
    });
  }, [mountedPathname]);

  if (!mountedPathname) return <GenericNotFound />;
  if (/^\/movies\//i.test(mountedPathname))
    return <MovieNotFound pathname={mountedPathname} />;
  if (/^\/festivals\//i.test(mountedPathname)) return <FestivalNotFound />;
  if (/^\/film-clubs\//i.test(mountedPathname)) return <FilmClubNotFound />;
  if (/^\/collections\//i.test(mountedPathname)) return <CollectionNotFound />;
  if (/^\/updates\//i.test(mountedPathname)) return <UpdateNotFound />;
  if (/^\/(london-cinemas|venues)\//i.test(mountedPathname))
    return <VenueNotFound />;
  return <GenericNotFound />;
}

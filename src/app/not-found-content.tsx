"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/utils/track-event";
import { ButtonLink } from "@/components/button";
import StatusPage from "@/components/status-page";

function GenericNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-ticket-ripped.svg"
      title="Page Not Found"
      message="We couldn't find that page. It may have been moved or removed."
      backLink={{ url: "/catalogue", text: "Back to film list" }}
      actions={<ButtonLink href="/catalogue">Back to film list</ButtonLink>}
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

/**
 * A film URL that moved never gets here: the movie-redirects Worker in front
 * of `/movies/*` answers the 404 with a redirect, before the page loads, when
 * it can tell where the film went (by id, by the old id of a listing since
 * matched, or by one showing film under the slug). So this is a film that has
 * finished with nothing like it showing, or two that a link could mean.
 */
function MovieNotFound() {
  return (
    <StatusPage
      iconSrc="/images/icons/neon-ticket-ripped.svg"
      title="Film Not Found"
      message="We couldn't find that film. It may no longer be showing or the link may have changed."
      backLink={{ url: "/catalogue", text: "Back to film list" }}
      actions={<ButtonLink href="/catalogue">Back to film list</ButtonLink>}
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

export default function NotFoundContent() {
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
  if (/^\/movies\//i.test(mountedPathname)) return <MovieNotFound />;
  if (/^\/festivals\//i.test(mountedPathname)) return <FestivalNotFound />;
  if (/^\/film-clubs\//i.test(mountedPathname)) return <FilmClubNotFound />;
  if (/^\/collections\//i.test(mountedPathname)) return <CollectionNotFound />;
  if (/^\/updates\//i.test(mountedPathname)) return <UpdateNotFound />;
  if (/^\/(london-cinemas|venues)\//i.test(mountedPathname))
    return <VenueNotFound />;
  return <GenericNotFound />;
}

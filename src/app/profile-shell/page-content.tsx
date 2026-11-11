"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/button";
import ContentSection from "@/components/content-section";
import LoadingIndicator from "@/components/loading-indicator";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import StandardPageLayout from "@/components/standard-page-layout";
import StatusPage, { StatusPageLoading } from "@/components/status-page";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  parseProfilePageData,
  PROFILE_DATA_ELEMENT_ID,
  type ProfileList,
  type ProfilePageData,
} from "@/lib/user-profile/page-data";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserContext } from "@/state/user-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import styles from "./page.module.css";

const PERSONALISE_PATH = "/personalise/";

let cached: { text: string | null; data: ProfilePageData } | undefined;

/** The Worker's script tag, parsed once. Read only in the browser. */
function readPageData(): ProfilePageData {
  const text =
    document.getElementById(PROFILE_DATA_ELEMENT_ID)?.textContent ?? null;
  if (cached?.text !== text)
    cached = { text, data: parseProfilePageData(text) };
  return cached.data;
}

const subscribe = () => () => {};

/**
 * The static HTML has no profile in it, so the first render, on the server
 * and in the browser alike, is undefined; the data is read after hydration,
 * since reading it during the first render would make the two disagree.
 */
function useProfilePageData() {
  return useSyncExternalStore(subscribe, readPageData, () => undefined);
}

export default function ProfileShellContent() {
  const data = useProfilePageData();
  if (!data) {
    return (
      <StatusPageLoading>
        <LoadingIndicator message="Loading profile…" />
      </StatusPageLoading>
    );
  }
  return <ProfilePage data={data} />;
}

/**
 * Who is looking, as far as the page needs to know. The Worker sends the
 * handle, never the uid, so the owner is recognised by their own profile
 * document, which only they can read: its handle is this page's. That works
 * for a private profile too, since it doesn't rely on what the Worker found.
 * Readers who aren't signed in never load Firebase.
 */
type Visitor =
  | "checking"
  /** Signed out, or signed in as someone else with nothing more to say. */
  | "anyone"
  | "owner"
  /** Signed in with the capability but no handle yet. */
  | "without-handle"
  /** Signed in without the capability. */
  | "without-capability";

function useVisitor(handle: string | undefined): {
  visitor: Visitor;
  /** The owner's profile is public, when the visitor is the owner. */
  ownerPublic: boolean;
  /** The owner still has the capability, when the visitor is the owner. */
  ownerGranted: boolean;
} {
  const { status, readProfile, readCapabilities } = useUserContext();
  const [result, setResult] = useState<{
    visitor: Visitor;
    ownerPublic: boolean;
    ownerGranted: boolean;
  } | null>(null);

  useEffect(() => {
    if (status !== "signed-in") return;
    let cancelled = false;
    Promise.all([readProfile(), readCapabilities()])
      .then(([profile, capabilities]) => {
        if (cancelled) return;
        const granted = CapabilityId.PublicProfile in capabilities;
        if (handle && profile?.handle === handle) {
          setResult({
            visitor: "owner",
            ownerPublic: profile.public,
            ownerGranted: granted,
          });
        } else {
          setResult({
            visitor: !granted
              ? "without-capability"
              : profile
                ? "anyone"
                : "without-handle",
            ownerPublic: false,
            ownerGranted: false,
          });
        }
      })
      .catch((error) => {
        // Nothing to say beyond what anyone is told.
        console.error("Couldn't check who's visiting", error);
        if (!cancelled) {
          setResult({
            visitor: "anyone",
            ownerPublic: false,
            ownerGranted: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, handle, readProfile, readCapabilities]);

  if (status === "checking") {
    return { visitor: "checking", ownerPublic: false, ownerGranted: false };
  }
  if (status !== "signed-in") {
    return { visitor: "anyone", ownerPublic: false, ownerGranted: false };
  }
  return (
    result ?? { visitor: "checking", ownerPublic: false, ownerGranted: false }
  );
}

export function ProfilePage({ data }: { data: ProfilePageData }) {
  return data.found ? (
    <FoundProfile data={data} />
  ) : (
    <ProfileNotFound handle={data.handle} />
  );
}

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;
}

function FoundProfile({
  data,
}: {
  data: Extract<ProfilePageData, { found: true }>;
}) {
  const { visitor } = useVisitor(data.handle);
  return (
    <StandardPageLayout
      title={data.handle}
      subtitle={`${plural(data.seen.count, "film", "films")} seen, ${plural(
        data.watchlist.count,
        "film",
        "films",
      )} on the watchlist`}
      heroExtra={
        visitor === "owner" && (
          <div className={styles.ownerActions}>
            <ButtonLink href={PERSONALISE_PATH} size="sm">
              Edit profile
            </ButtonLink>
          </div>
        )
      }
      width="wide"
    >
      <ProfileListSection
        title="Watchlist"
        list={data.watchlist}
        empty={`${data.handle} has nothing on their watchlist yet.`}
      />
      <ProfileListSection
        title="Seen"
        list={data.seen}
        empty={`${data.handle} hasn't marked any films as seen yet.`}
      />
    </StandardPageLayout>
  );
}

function ProfileListSection({
  title,
  list,
  empty,
}: {
  title: string;
  list: ProfileList;
  empty: string;
}) {
  const { movies } = useCinemaData();
  const more = list.count - list.films.length;
  return (
    <ContentSection
      title={title}
      titleBadge={
        <span className={styles.count}>
          {list.count.toLocaleString("en-GB")}
        </span>
      }
    >
      {list.films.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <>
          <div className={styles.lane}>
            <PosterTileList>
              {list.films.map((film) => (
                <PosterTile
                  key={film.id}
                  title={film.title}
                  // As on /personalise: the snapshot is all a film that's left
                  // the dataset has, and one still in it may have a poster now.
                  posterPath={movies[film.id]?.posterPath ?? film.posterPath}
                  includedMovies={movies[film.id]?.includedMovies}
                  // Linked only while showing: a departed page may not exist.
                  href={
                    movies[film.id]
                      ? getMovieUrl({ id: film.id, title: film.title })
                      : undefined
                  }
                  details={film.year ? [film.year] : undefined}
                />
              ))}
            </PosterTileList>
          </div>
          {more > 0 && (
            <p className={styles.more}>
              and {plural(more, "more film", "more films")}
            </p>
          )}
        </>
      )}
    </ContentSection>
  );
}

const NOT_FOUND_ICON = "/images/icons/neon-ticket-ripped.svg";
const BACK_LINK = { url: "/catalogue/", text: "Back to film list" };

/**
 * Unknown, private and revoked are one response from the Worker, so they look
 * the same to everyone but the owner, and the owner is only told about a
 * private profile. A revoked one reads as missing, as it does to anyone else.
 */
function ProfileNotFound({ handle }: { handle?: string }) {
  const { visitor, ownerPublic, ownerGranted } = useVisitor(handle);

  if (visitor === "checking") {
    return (
      <StatusPageLoading>
        <LoadingIndicator message="Loading profile…" />
      </StatusPageLoading>
    );
  }

  if (visitor === "owner" && ownerGranted && !ownerPublic) {
    return (
      <StatusPage
        iconSrc={NOT_FOUND_ICON}
        backLink={BACK_LINK}
        title="Your Profile Is Private"
        message="This is your profile. Only you can see this page: make it public in Personalise and anyone with the link can see your lists."
        actions={
          <ButtonLink href={PERSONALISE_PATH}>Go to Personalise</ButtonLink>
        }
      />
    );
  }

  if (visitor === "without-handle") {
    return (
      <StatusPage
        iconSrc={NOT_FOUND_ICON}
        backLink={BACK_LINK}
        title="Profile Not Found"
        message="There's no public profile at this address. Want one of your own? Set up your profile in Personalise."
        actions={
          <ButtonLink href={PERSONALISE_PATH}>Go to Personalise</ButtonLink>
        }
      />
    );
  }

  if (visitor === "without-capability") {
    return (
      <StatusPage
        iconSrc={NOT_FOUND_ICON}
        backLink={BACK_LINK}
        title="Profile Not Found"
        message={
          <>
            There&apos;s no public profile at this address. Public profiles are
            in early access: to ask about one, email{" "}
            <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>.
          </>
        }
        actions={<ButtonLink href="/catalogue/">Back to film list</ButtonLink>}
      />
    );
  }

  return (
    <StatusPage
      iconSrc={NOT_FOUND_ICON}
      backLink={BACK_LINK}
      title="Profile Not Found"
      message="There's no public profile at this address."
      actions={<ButtonLink href="/catalogue/">Back to film list</ButtonLink>}
    />
  );
}

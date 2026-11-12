"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import StatusPage, { StatusPageLoading } from "@/components/status-page";
import { CapabilityId } from "@/lib/user-capabilities";
import {
  parseProfilePageData,
  PROFILE_DATA_ELEMENT_ID,
  type ProfilePageData,
  type PublicProfile,
} from "@/lib/user-profile/page-data";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import {
  FavouriteVenuesSection,
  UserListSection,
} from "@/app/personalise/page-content";
import SeenStats, {
  type MovieListProgressItem,
} from "@/app/personalise/seen-stats";
import personaliseStyles from "@/app/personalise/page.module.css";
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

export default function ProfileShellContent(build: ProfileBuildData) {
  const data = useProfilePageData();
  if (!data) {
    return (
      <StatusPageLoading>
        <LoadingIndicator message="Loading profile…" />
      </StatusPageLoading>
    );
  }
  return <ProfilePage data={data} {...build} />;
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

/** What the page needs from the build, as `/personalise` has it. */
export type ProfileBuildData = {
  /** Venue id → logo (`getVenueImagePaths`). */
  venueImagePaths: Record<string, string>;
  /** The film lists, for progress through them in the Seen stats. */
  movieLists: MovieListProgressItem[];
};

export function ProfilePage({
  data,
  venueImagePaths,
  movieLists,
}: { data: ProfilePageData } & ProfileBuildData) {
  return data.found ? (
    <FoundProfile
      profile={data}
      venueImagePaths={venueImagePaths}
      movieLists={movieLists}
    />
  ) : (
    <ProfileNotFound handle={data.handle} />
  );
}

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;
}

/**
 * The profile as `/personalise` shows the owner their own, with its sections
 * read only: the Seen stats, the watchlist, the favourite venues and the Seen
 * list, in that order.
 */
function FoundProfile({
  profile,
  venueImagePaths,
  movieLists,
}: { profile: PublicProfile } & ProfileBuildData) {
  const { handle, lists, favouriteVenues, filmDetails } = profile;
  const { visitor } = useVisitor(handle);
  const seen = Object.keys(lists[UserListId.Seen]).length;
  const watchlist = Object.keys(lists[UserListId.Watchlist]).length;

  // Full width, as /personalise is signed in: the page is mostly posters.
  return (
    <StandardPageLayout
      title={handle}
      subtitle={`${plural(seen, "film", "films")} seen, ${plural(
        watchlist,
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
      afterContent={
        <div className={personaliseStyles.wide}>
          <SeenStats
            seen={lists[UserListId.Seen]}
            movieLists={movieLists}
            details={filmDetails}
          />
          <UserListSection
            listId={UserListId.Watchlist}
            lists={lists}
            showEditing={false}
            publicView
          />
          <FavouriteVenuesSection
            favouriteVenues={favouriteVenues}
            showEditing={false}
            venueImagePaths={venueImagePaths}
            publicView
          />
          <UserListSection
            listId={UserListId.Seen}
            lists={lists}
            showEditing={false}
            publicView
          />
        </div>
      }
    >
      {null}
    </StandardPageLayout>
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

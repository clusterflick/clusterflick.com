"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import LoadingIndicator from "@/components/loading-indicator";
import CardGrid from "@/components/card-grid";
import LinkCard, { CardContent } from "@/components/link-card";
import Button from "@/components/button";
import { BookmarkIcon, EyeIcon } from "@/components/icons";
import { REQUIRES_RECENT_LOGIN, useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { UserListId, type UserLists } from "@/lib/user-lists";
import styles from "./page.module.css";

const LIST_TITLES: Record<UserListId, string> = {
  [UserListId.Watchlist]: "Watchlist",
  [UserListId.Seen]: "Seen",
};

/** Where to find films to add, offered while the watchlist is empty. */
const DISCOVERY_LINKS = [
  {
    key: "lists",
    href: "/lists",
    label: "Film Lists",
    detail: "Classics and award winners from the big lists, showing in London",
  },
  {
    key: "festivals",
    href: "/festivals",
    label: "Festivals",
    detail:
      "Film festivals running across London, from the big names to the niche",
  },
  {
    key: "film-clubs",
    href: "/film-clubs",
    label: "Film Clubs",
    detail:
      "Screenings put on by London's film clubs, in venues across the city",
  },
  {
    key: "near-me",
    href: "/near-me",
    label: "Near Me",
    detail: "Cinemas, film clubs and festivals close to wherever you are",
  },
];

/**
 * The key a film sorts by. A film still in the dataset has the pipeline's
 * `normalizedTitle`, which /catalogue and /planner sort by too; one that has
 * left it has only its snapshot, so this folds that the same way the build's
 * `simplifySorting` does. Each group is drawn wholly from one or the other.
 */
function getSortTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/^the /, "")
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "");
}

/** The parameters Firebase appends to the return URL of a sign-in link. */
function isSignInLink(url: URL) {
  return (
    url.searchParams.get("mode") === "signIn" && url.searchParams.has("oobCode")
  );
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : undefined;
}

function describeError(error: unknown): string {
  switch (getErrorCode(error)) {
    case "auth/invalid-email":
    case "auth/missing-email":
      return "That doesn't look like an email address.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "That link has expired or has already been used. Send yourself a new one.";
    case "auth/quota-exceeded":
    case "auth/too-many-requests":
      return "We can't send any more links right now. Please try again later.";
    case "auth/network-request-failed":
      return "We couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

type LinkState =
  | { step: "idle" }
  | { step: "sending" }
  | { step: "sent"; email: string }
  | { step: "completing" }
  | { step: "needs-email" }
  | { step: "error"; message: string };

export default function PersonalisePageContent() {
  const { status } = useUserContext();

  // Signed in, the page is mostly poster grids, so it takes the full width
  // rather than the 1000px column, which fits only four posters across.
  return (
    <StandardPageLayout
      title="Personalise"
      subtitle="Keep track of the films you want to see, and the ones you have."
      afterContent={status === "signed-in" ? <SignedIn /> : undefined}
    >
      {status === "unavailable" ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Not available yet"
          message="Personalisation isn't switched on in this build."
        />
      ) : status === "checking" ? (
        <LoadingIndicator message="Checking whether you're signed in…" />
      ) : status === "signed-in" ? null : (
        <SignedOut />
      )}
    </StandardPageLayout>
  );
}

function SignedOut() {
  return (
    <>
      <ul className={styles.features}>
        <li className={styles.feature}>
          <BookmarkIcon size={28} className={styles.featureIcon} />
          <h2 className={styles.featureTitle}>Build a watchlist</h2>
          <p className={styles.featureText}>
            Save the films you want to see, and spot at a glance which of them
            are showing now.
          </p>
        </li>
        <li className={styles.feature}>
          <EyeIcon size={28} className={styles.featureIcon} />
          <h2 className={styles.featureTitle}>
            Remember what you&apos;ve seen
          </h2>
          <p className={styles.featureText}>
            Mark films as seen, and they come off your watchlist.
          </p>
        </li>
      </ul>
      <SignInForm />
      <WhatWeStore />
    </>
  );
}

function SignInForm() {
  const { sendSignInLink, completeSignIn, getPendingEmail } = useUserContext();
  // Prefilled while an address is still held from a link sent within the
  // hour, so a failed or expired link is one click from a fresh one.
  const [email, setEmail] = useState(() => getPendingEmail() ?? "");
  // Only ever mounted client-side, once the status is known, so reading the
  // URL here can't mismatch the server render.
  const [state, setState] = useState<LinkState>(() =>
    isSignInLink(new URL(window.location.href))
      ? { step: "completing" }
      : { step: "idle" },
  );
  const attempted = useRef(false);

  // A sign-in link lands back here. Redeem it once — a second attempt (Strict
  // Mode's double effect) would find the code already spent.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (attempted.current || !isSignInLink(url)) return;
    attempted.current = true;
    completeSignIn().then(
      (result) => {
        if (result === "needs-email") {
          setState({ step: "needs-email" });
        } else {
          window.history.replaceState(null, "", url.pathname);
        }
      },
      (error) => {
        window.history.replaceState(null, "", url.pathname);
        setState({ step: "error", message: describeError(error) });
      },
    );
  }, [completeSignIn]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (state.step === "needs-email") {
      setState({ step: "completing" });
      try {
        await completeSignIn(address);
        window.history.replaceState(null, "", window.location.pathname);
      } catch (error) {
        setState({ step: "error", message: describeError(error) });
      }
      return;
    }
    setState({ step: "sending" });
    try {
      await sendSignInLink(address);
      setState({ step: "sent", email: address });
    } catch (error) {
      setState({ step: "error", message: describeError(error) });
    }
  };

  if (state.step === "completing") {
    return <LoadingIndicator message="Signing you in…" />;
  }

  if (state.step === "sent") {
    return (
      <EmptyState
        icon={{
          src: "/images/icons/neon-ticket.svg",
          width: 120,
          height: 120,
        }}
        title="Check your inbox"
        message={
          <>
            We&apos;ve sent a sign-in link to <strong>{state.email}</strong>.
          </>
        }
        hint="It can take a minute to arrive — have a look in your spam folder if it doesn't."
        actions={
          <Button
            variant="secondary"
            onClick={() => setState({ step: "idle" })}
          >
            Use a different email
          </Button>
        }
      />
    );
  }

  const confirming = state.step === "needs-email";

  return (
    <form className={styles.signIn} onSubmit={onSubmit}>
      <p id="personalise-email-intro" className={styles.signInIntro}>
        {confirming
          ? "This link was opened in a different browser from the one it was sent from. Enter your email to finish signing in."
          : "Enter your email to sign in, or to create an account if you're new."}
      </p>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="email"
          autoComplete="email"
          required
          aria-label="Email address"
          aria-describedby="personalise-email-intro"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <Button type="submit" disabled={state.step === "sending"}>
          {confirming
            ? "Sign in"
            : state.step === "sending"
              ? "Sending…"
              : "Email me a link"}
        </Button>
      </div>
      {state.step === "error" && (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}

function SignedIn() {
  const { lists } = useUserContext();

  return (
    <div className={styles.wide}>
      <AccountBar />
      {lists ? (
        <>
          <UserListSection listId={UserListId.Watchlist} lists={lists} />
          <UserListSection listId={UserListId.Seen} lists={lists} />
        </>
      ) : (
        <LoadingIndicator message="Loading your lists…" />
      )}
      <WhatWeStore />
    </div>
  );
}

function AccountBar() {
  const { email, signOut, deleteAccount } = useUserContext();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onDelete = async () => {
    setDeleteError(null);
    try {
      await deleteAccount();
    } catch (error) {
      setDeleteError(
        getErrorCode(error) === REQUIRES_RECENT_LOGIN
          ? "Your lists have been deleted. To delete your account too, sign out, sign in again with a fresh link, and delete it from here."
          : describeError(error),
      );
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.accountRow}>
        <p className={styles.signedInAs}>
          Signed in as <strong>{email}</strong>
        </p>
        <div className={styles.accountActions}>
          {confirmingDelete ? (
            <>
              <span className={styles.confirmText}>
                Delete your account and lists?
              </span>
              <Button size="sm" onClick={onDelete}>
                Delete
              </Button>
              <Button variant="link" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="link" onClick={signOut}>
                Sign out
              </Button>
              <Button variant="link" onClick={() => setConfirmingDelete(true)}>
                Delete account
              </Button>
            </>
          )}
        </div>
      </div>
      {deleteError && (
        <p className={styles.error} role="alert">
          {deleteError}
        </p>
      )}
    </div>
  );
}

function UserListSection({
  listId,
  lists,
}: {
  listId: UserListId;
  lists: UserLists;
}) {
  const { removeFromList } = useUserContext();
  const { movies, hasAttemptedLoad, isLoading, error } = useCinemaData();
  const title = LIST_TITLES[listId];
  const entries = Object.entries(lists[listId])
    .map(([id, entry]) => ({
      id,
      entry,
      sortTitle: movies[id]?.normalizedTitle ?? getSortTitle(entry.title),
    }))
    .sort((a, b) => a.sortTitle.localeCompare(b.sortTitle));

  if (entries.length === 0) {
    return (
      <ContentSection title={title}>
        {listId === UserListId.Watchlist ? (
          <>
            <p className={styles.empty}>
              Nothing here yet. Press <strong>Want to see</strong> on any
              film&apos;s page to save it. Looking for somewhere to start?
            </p>
            {/* The "Built with Clusterflick" card from the About page, minus
                the logo: none of these sections has an icon of its own. */}
            <CardGrid size="md" className={styles.discovery}>
              {DISCOVERY_LINKS.map((link) => (
                <LinkCard key={link.key} href={link.href} variant="social">
                  <CardContent>
                    <strong>{link.label}</strong>
                    <span className={styles.discoveryText}>{link.detail}</span>
                  </CardContent>
                </LinkCard>
              ))}
            </CardGrid>
          </>
        ) : (
          <p className={styles.empty}>
            Nothing here yet. Press <strong>Seen it</strong> on a film&apos;s
            page once you&apos;ve watched it.
          </p>
        )}
      </ContentSection>
    );
  }

  const toTile = (
    { id, entry }: (typeof entries)[number],
    showing: boolean,
  ) => (
    <PosterTile
      key={id}
      title={entry.title}
      // The snapshot is all a film that's left the dataset has; one that's
      // still in it may have gained a poster since it was added.
      posterPath={movies[id]?.posterPath ?? entry.posterPath}
      // An event (a marathon, a double bill) has no poster of its own and is
      // drawn as a stack of its films' posters.
      includedMovies={movies[id]?.includedMovies}
      // Unlinked when not showing: whether its departed page still exists is
      // only known at build time, and a dead link is worse than none.
      href={showing ? getMovieUrl({ id, title: entry.title }) : undefined}
      details={entry.year ? [entry.year] : undefined}
      action={
        <Button
          variant="link"
          onClick={() => removeFromList(listId, id)}
          aria-label={`Remove ${entry.title} from ${title}`}
        >
          Remove
        </Button>
      }
    />
  );

  const count = <span className={styles.count}>{entries.length}</span>;

  if (!hasAttemptedLoad || isLoading) {
    return (
      <ContentSection title={title} titleBadge={count}>
        <LoadingIndicator message="Checking what's showing…" size="sm" />
      </ContentSection>
    );
  }

  // Without the data there's no telling what's showing, so everything is
  // listed and linked as it is — the grid doesn't prune on an error either.
  if (error) {
    return (
      <ContentSection title={title} titleBadge={count}>
        <div className={styles.lane}>
          <PosterTileList>
            {entries.map((entry) => toTile(entry, true))}
          </PosterTileList>
        </div>
      </ContentSection>
    );
  }

  const showing = entries.filter(({ id }) => movies[id]);
  const notShowing = entries.filter(({ id }) => !movies[id]);

  return (
    <ContentSection title={title} titleBadge={count}>
      {showing.length > 0 && (
        <>
          <h3 className={styles.groupTitle}>Showing now</h3>
          <div className={styles.lane}>
            <PosterTileList>
              {showing.map((entry) => toTile(entry, true))}
            </PosterTileList>
          </div>
        </>
      )}
      {notShowing.length > 0 && (
        <>
          <h3 className={styles.groupTitle}>Not showing</h3>
          <div className={styles.lane}>
            <PosterTileList>
              {notShowing.map((entry) => toTile(entry, false))}
            </PosterTileList>
          </div>
        </>
      )}
    </ContentSection>
  );
}

function WhatWeStore() {
  return (
    <aside className={styles.storeNote}>
      <h2 className={styles.storeNoteTitle}>What we store</h2>
      <p>
        Your email address, so we can send you sign-in links, and the films you
        add to your lists. Nothing else, and we never share it. You can delete
        your account, and everything in it, from this page at any time.
      </p>
    </aside>
  );
}

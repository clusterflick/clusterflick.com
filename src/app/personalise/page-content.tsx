"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import FilmPosterGrid, {
  type FilmPosterGridMovie,
} from "@/components/film-poster-grid";
import LoadingIndicator from "@/components/loading-indicator";
import Button from "@/components/button";
import { REQUIRES_RECENT_LOGIN, useUserContext } from "@/state/user-context";
import {
  UserListId,
  type UserListEntry,
  type UserLists,
} from "@/lib/user-lists";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./page.module.css";

const LIST_LABELS: Record<UserListId, { title: string; empty: string }> = {
  [UserListId.Watchlist]: {
    title: "Watchlist",
    empty: "Films you want to catch will appear here.",
  },
  [UserListId.Seen]: {
    title: "Seen",
    empty: "Films you've watched will appear here.",
  },
};

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
      return "That link has expired or has already been used. Send yourself a new one below.";
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

  return (
    <StandardPageLayout
      title="Personalise"
      subtitle="Keep track of the films you want to see, and the ones you have."
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
      ) : status === "signed-in" ? (
        <SignedIn />
      ) : (
        <SignIn />
      )}
    </StandardPageLayout>
  );
}

function SignIn() {
  const { sendSignInLink, completeSignIn } = useUserContext();
  const [email, setEmail] = useState("");
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
    <>
      <ContentSection
        title={confirming ? "Confirm your email" : "Sign in or sign up"}
        intro={
          confirming
            ? "This link was opened in a different browser from the one it was requested in. Enter the email address you sent it to, to finish signing in."
            : "Enter your email and we'll send you a link — no password needed. If you're new here, the same link sets you up."
        }
      >
        <form className={styles.form} onSubmit={onSubmit}>
          <label htmlFor="personalise-email" className={styles.label}>
            Email address
          </label>
          <div className={styles.row}>
            <input
              id="personalise-email"
              className={styles.input}
              type="email"
              autoComplete="email"
              required
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
      </ContentSection>
      <WhatWeStore />
    </>
  );
}

function SignedIn() {
  const { email, lists, signOut, deleteAccount } = useUserContext();
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
    <>
      <p className={styles.signedInAs}>
        Signed in as <strong>{email}</strong>
      </p>

      {lists ? (
        Object.values(UserListId).map((listId) => (
          <UserListSection key={listId} listId={listId} lists={lists} />
        ))
      ) : (
        <LoadingIndicator message="Loading your lists…" />
      )}

      <ContentSection title="Your account">
        <div className={styles.accountActions}>
          <Button variant="secondary" onClick={signOut}>
            Sign out
          </Button>
          {confirmingDelete ? (
            <>
              <Button onClick={onDelete}>
                Yes, delete my account and lists
              </Button>
              <Button variant="link" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="link" onClick={() => setConfirmingDelete(true)}>
              Delete my account
            </Button>
          )}
        </div>
        {deleteError && (
          <p className={styles.error} role="alert">
            {deleteError}
          </p>
        )}
      </ContentSection>
      <WhatWeStore />
    </>
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
  const { title, empty } = LIST_LABELS[listId];
  const entries = Object.entries(lists[listId]).sort(
    ([, a], [, b]) => b.addedAt - a.addedAt,
  );

  if (entries.length === 0) {
    return (
      <ContentSection title={title}>
        <p className={styles.empty}>{empty}</p>
      </ContentSection>
    );
  }

  const toGridMovie = (
    [id, entry]: [string, UserListEntry],
    showing: boolean,
  ): FilmPosterGridMovie => ({
    // The snapshot is all a film that's left the dataset has; one that's
    // still in it may have gained a poster since it was added.
    movie: {
      id,
      title: entry.title,
      year: entry.year,
      posterPath: movies[id]?.posterPath ?? entry.posterPath,
    },
    performanceCount: 0,
    // Unlinked when not showing: whether its departed page still exists is
    // only known at build time, and a dead link is worse than none.
    unavailable: !showing,
    notice: showing ? undefined : "Not showing",
    action: (
      <Button
        variant="link"
        onClick={() => removeFromList(listId, id)}
        aria-label={`Remove ${entry.title} from ${title}`}
      >
        Remove
      </Button>
    ),
  });

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
        <FilmPosterGrid
          movies={entries.map((entry) => toGridMovie(entry, true))}
        />
      </ContentSection>
    );
  }

  const showing = entries.filter(([id]) => movies[id]);
  const notShowing = entries.filter(([id]) => !movies[id]);

  return (
    <ContentSection title={title} titleBadge={count}>
      {showing.length > 0 && (
        <>
          <h3 className={styles.groupTitle}>Showing now</h3>
          <FilmPosterGrid
            movies={showing.map((entry) => toGridMovie(entry, true))}
          />
        </>
      )}
      {notShowing.length > 0 && (
        <>
          <h3 className={styles.groupTitle}>Not showing</h3>
          <FilmPosterGrid
            movies={notShowing.map((entry) => toGridMovie(entry, false))}
          />
        </>
      )}
    </ContentSection>
  );
}

function WhatWeStore() {
  return (
    <ContentSection title="What we store" as="h3">
      <p className={styles.small}>
        Your email address, so we can send you sign-in links, and the films you
        add to your lists. Nothing else, and we never share it. You can delete
        your account, and everything in it, from this page at any time.
      </p>
    </ContentSection>
  );
}

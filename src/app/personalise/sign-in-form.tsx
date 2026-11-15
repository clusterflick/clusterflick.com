"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Button from "@/components/button";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import { useUserContext } from "@/state/user-context";
import styles from "./page.module.css";

/** The parameters Firebase appends to the return URL of a sign-in link. */
function isSignInLink(url: URL) {
  return (
    url.searchParams.get("mode") === "signIn" && url.searchParams.has("oobCode")
  );
}

/** What Firebase adds to a sign-in link's return URL. */
const SIGN_IN_PARAMS = [
  "apiKey",
  "oobCode",
  "mode",
  "continueUrl",
  "lang",
  "tenantId",
];

/**
 * The page's own address once the link is spent: Firebase's parameters gone,
 * the page's own kept (/connect/ carries the request it's finishing).
 */
export function withoutSignInLink(url: URL): string {
  const kept = new URL(url);
  for (const name of SIGN_IN_PARAMS) kept.searchParams.delete(name);
  return kept.pathname + kept.search;
}

export function getErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error && "code" in error
    ? String(error.code)
    : undefined;
}

export function describeError(error: unknown): string {
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

/**
 * The email sign-in form, which also finishes a sign-in when its link lands
 * back on the page. `returnTo` is the page the link opens, which must render
 * this form too: /personalise/ unless the page needs the reader back, as
 * /connect/ does with its own parameters kept.
 */
export default function SignInForm({ returnTo }: { returnTo?: string } = {}) {
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
          window.history.replaceState(null, "", withoutSignInLink(url));
        }
      },
      (error) => {
        window.history.replaceState(null, "", withoutSignInLink(url));
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
        window.history.replaceState(
          null,
          "",
          withoutSignInLink(new URL(window.location.href)),
        );
      } catch (error) {
        setState({ step: "error", message: describeError(error) });
      }
      return;
    }
    setState({ step: "sending" });
    try {
      await sendSignInLink(address, returnTo);
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

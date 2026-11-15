"use client";

import { useRef, useState, type FormEvent } from "react";
import Button from "@/components/button";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import {
  getConnectCallbackUrl,
  parseConnectState,
} from "@/lib/assistant-access";
import { useUserContext } from "@/state/user-context";
import SignInForm from "../personalise/sign-in-form";
import styles from "./page.module.css";

/**
 * The sign-in step of connecting an AI assistant. The assistant sent the
 * reader to api-mcp, which asked them to approve it and sent them here with
 * the request it's finishing (`state`). Here they sign in as on /personalise,
 * then their sign-in is posted to the Worker, which checks it, and the
 * account's `assistantAccess`, and sends them back to their assistant.
 *
 * A form post rather than a fetch: it's the browser that the Worker's
 * binding cookie was set in that has to arrive, and the Worker answers with
 * a redirect to the assistant.
 */
export default function ConnectPageContent() {
  const { status } = useUserContext();

  return (
    <StandardPageLayout
      title="Connect your AI assistant"
      subtitle="Sign in to let your assistant search Clusterflick's listings for you."
    >
      {status === "unavailable" ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Not available yet"
          message="Signing in isn't switched on in this build."
        />
      ) : status === "checking" ? (
        <LoadingIndicator message="Checking whether you're signed in…" />
      ) : (
        <Connect />
      )}
    </StandardPageLayout>
  );
}

function Connect() {
  const { status, email, getIdToken, signOut } = useUserContext();
  // Only ever mounted client-side, once the status is known.
  const [state] = useState(() => parseConnectState(window.location.search));
  const form = useRef<HTMLFormElement>(null);
  const token = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) {
    return (
      <EmptyState
        icon={{ src: "/images/icons/neon-ticket.svg", width: 120, height: 120 }}
        title="Start from your assistant"
        message="This page finishes connecting an AI assistant, and this link isn't one an assistant sent. Add Clusterflick in your assistant to start again."
      />
    );
  }

  if (status !== "signed-in") {
    return (
      <>
        <p className={styles.intro}>
          Sign in with the email address your account uses. The link we send
          brings you back here; open it in this browser.
        </p>
        <SignInForm returnTo={`/connect/?state=${state}`} />
      </>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      // Fresh, so the Worker never sees one about to expire.
      token.current!.value = await getIdToken(true);
      form.current!.submit();
    } catch (failure) {
      console.error("Failed to get a sign-in token", failure);
      setSending(false);
      setError("We couldn't confirm your sign-in. Please try again.");
    }
  };

  return (
    <form
      ref={form}
      className={styles.connect}
      method="post"
      action={getConnectCallbackUrl(state)}
      onSubmit={onSubmit}
    >
      <p className={styles.intro}>
        You&apos;re signed in as <strong>{email}</strong>. Your assistant will
        search Clusterflick as you.
      </p>
      <input ref={token} type="hidden" name="idToken" />
      <div className={styles.actions}>
        <Button type="submit" disabled={sending}>
          {sending ? "Connecting…" : "Continue"}
        </Button>
        <Button
          variant="link"
          onClick={() => {
            signOut().catch((failure) =>
              console.error("Failed to sign out", failure),
            );
          }}
        >
          Not you? Sign out
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

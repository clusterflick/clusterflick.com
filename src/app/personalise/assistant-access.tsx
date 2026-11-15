"use client";

import { useEffect, useState } from "react";
import { formatDateLong } from "@clusterflick/catalogue/utils/format-date";
import Button from "@/components/button";
import {
  describeScopes,
  disconnectAssistant,
  listConnections,
  MCP_URL,
  type Connection,
} from "@/lib/assistant-access";
import { CapabilityId } from "@/lib/user-capabilities";
import { useUserContext } from "@/state/user-context";
import styles from "./page.module.css";

/**
 * Whether the reader has `assistantAccess`, for the account bar to offer its
 * panel. False until known, and if the capabilities can't be read: it's
 * invitation-only and never advertised, so a panel nobody can reach is
 * better than a broken page, as the public profile's.
 */
export function useAssistantAccess(): boolean {
  const { status, readCapabilities } = useUserContext();
  const signedIn = status === "signed-in";
  const [granted, setGranted] = useState(false);

  // Only once signed in: reading before Firebase has said who is fails.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    readCapabilities().then(
      (capabilities) => {
        if (!cancelled)
          setGranted(CapabilityId.AssistantAccess in capabilities);
      },
      (error) => console.error("Failed to load capabilities", error),
    );
    return () => {
      cancelled = true;
    };
  }, [signedIn, readCapabilities]);

  return granted;
}

/**
 * Opened from the account bar: the address to add to an AI assistant, which
 * signs the reader in through /connect/ the first time, and the assistants
 * they've connected, to disconnect.
 */
export function AssistantAccessSummary() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(MCP_URL).then(
      () => setCopied(true),
      (error) => console.error("Failed to copy the address", error),
    );
  };

  return (
    <div className={styles.management}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Connect your assistant</h3>
        <p className={styles.managementText}>
          Your AI assistant can search Clusterflick&apos;s listings for you: ask
          it what&apos;s on near you tonight, or when a film is showing. Add
          this address to it, and sign in here when it asks.
        </p>
        <p className={styles.assistantAddress}>
          <code>{MCP_URL}</code>
        </p>
        <div className={styles.managementActions}>
          <Button size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy address"}
          </Button>
        </div>
      </section>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Adding it</h3>
        <p className={styles.managementText}>
          In Claude, add it as a custom connector. Other assistants call it an
          MCP server. In Claude Code, run:
        </p>
        <p className={styles.assistantAddress}>
          <code>claude mcp add --transport http clusterflick {MCP_URL}</code>
        </p>
      </section>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>What it can see</h3>
        <p className={styles.managementText}>
          It searches London&apos;s screenings, films and venues as you. When
          you connect it, you can also let it see your watchlist, Seen list and
          venues, so it can leave out what you&apos;ve seen and find what&apos;s
          on from your watchlist. It can&apos;t change anything on your account.
        </p>
      </section>
      <ConnectedAssistants />
    </div>
  );
}

type ConnectionsState =
  | { step: "loading" }
  | { step: "failed" }
  | { step: "loaded"; connections: Connection[] };

/**
 * The assistants the reader has connected, each to disconnect: its access
 * ends at once, and it would have to be signed in again. When one was last
 * used isn't kept, so it isn't shown.
 */
function ConnectedAssistants() {
  const { getIdToken } = useUserContext();
  const [state, setState] = useState<ConnectionsState>({ step: "loading" });
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getIdToken()
      .then(listConnections)
      .then(
        (connections) => {
          if (!cancelled) setState({ step: "loaded", connections });
        },
        (failure) => {
          console.error("Failed to load connected assistants", failure);
          if (!cancelled) setState({ step: "failed" });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  const disconnect = async (id: string) => {
    setRemoving(id);
    setError(null);
    try {
      await disconnectAssistant(await getIdToken(), id);
      setState((current) =>
        current.step === "loaded"
          ? {
              step: "loaded",
              connections: current.connections.filter((c) => c.id !== id),
            }
          : current,
      );
    } catch (failure) {
      console.error("Failed to disconnect an assistant", failure);
      setError("We couldn't disconnect it. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section
      className={`${styles.managementSection} ${styles.assistantConnections}`}
    >
      <h3 className={styles.managementTitle}>Connected assistants</h3>
      {state.step === "loading" ? (
        <p className={styles.managementText}>Checking…</p>
      ) : state.step === "failed" ? (
        <p className={styles.managementText}>
          We couldn&apos;t load your connected assistants just now.
        </p>
      ) : state.connections.length === 0 ? (
        <p className={styles.managementText}>
          None yet. Once you&apos;ve added the address and signed in, your
          assistant shows here.
        </p>
      ) : (
        <ul className={styles.assistantList}>
          {state.connections.map((connection) => {
            const { can, cannot } = describeScopes(connection.scopes);
            return (
              <li key={connection.id} className={styles.assistantItem}>
                <div className={styles.assistantDetails}>
                  <span className={styles.managementText}>
                    <strong>{connection.name}</strong>
                    {connection.domain && connection.domain !== connection.name
                      ? ` (${connection.domain})`
                      : ""}
                    , connected {formatDateLong(connection.connectedAt)}
                  </span>
                  <span className={styles.managementText}>
                    {can.join(" · ")}
                  </span>
                  {cannot.length > 0 && (
                    <span className={styles.managementText}>
                      {cannot.join(" · ")}. To allow it, disconnect it and
                      connect it again.
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={removing !== null}
                  onClick={() => disconnect(connection.id)}
                >
                  {removing === connection.id ? "Disconnecting…" : "Disconnect"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

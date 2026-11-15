"use client";

import { useEffect, useState } from "react";
import { formatDateLong } from "@clusterflick/catalogue/utils/format-date";
import Button from "@/components/button";
import ReleaseDot from "@/components/release-dot";
import {
  describeScopes,
  disconnectAssistant,
  listConnections,
  MCP_URL,
  type Connection,
} from "@/lib/assistant-access";
import { CapabilityId } from "@/lib/user-capabilities";
import { useUserContext } from "@/state/user-context";
import OnOffItem from "./on-off-item";
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
 * Opened from the account bar: on the left, the address to add to an AI
 * assistant and how, which signs the reader in through /connect/ the first
 * time; on the right, the assistants they've connected, each saying what it
 * can see, to disconnect. What one can see is the connection's, chosen when
 * it was connected, so the panel doesn't describe it for them all.
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
    <div className={`${styles.management} ${styles.assistantManagement}`}>
      <section className={styles.managementSection}>
        <h3 className={styles.managementTitle}>Connect your assistant</h3>
        <p className={styles.managementText}>
          Your AI assistant can search Clusterflick&apos;s listings for you: ask
          it what&apos;s on near you tonight, or when a film is showing. Add
          this address to it, and sign in here when it asks. You choose what
          each assistant can see when you connect it.
        </p>
        <div className={styles.assistantAddressRow}>
          <input
            className={`${styles.input} ${styles.assistantAddress}`}
            type="text"
            readOnly
            value={MCP_URL}
            aria-label="The address to add to your assistant"
            onFocus={(event) => event.currentTarget.select()}
            onClick={(event) => event.currentTarget.select()}
          />
          <Button size="sm" onClick={copy}>
            {copied ? "Copied" : "Copy address"}
          </Button>
        </div>
        <h3 className={`${styles.managementTitle} ${styles.assistantSubtitle}`}>
          Adding it
        </h3>
        <ul className={styles.assistantSteps}>
          <li className={styles.managementText}>
            <strong>Claude</strong>, on the web or in the desktop app: Plugins →
            Add (top right) → Add custom connector, then paste the address. On a
            Team or Enterprise plan, an owner adds it under Organization
            settings → Connectors.
          </li>
          <li className={styles.managementText}>
            <strong>Claude Code</strong>: run{" "}
            <code>claude mcp add --transport http clusterflick {MCP_URL}</code>
          </li>
          <li className={styles.managementText}>
            <strong>Any other assistant</strong> that supports remote MCP
            servers with sign-in: add the address as an MCP server.
          </li>
        </ul>
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
    <section className={styles.managementSection}>
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
            const scopes = describeScopes(connection.scopes);
            return (
              <li key={connection.id} className={styles.assistantItem}>
                <div className={styles.assistantDetails}>
                  <span className={styles.managementText}>
                    <ReleaseDot />{" "}
                    <strong className={styles.assistantName}>
                      {connection.name}
                    </strong>
                    {connection.domain && connection.domain !== connection.name
                      ? ` (${connection.domain})`
                      : ""}
                    , connected {formatDateLong(connection.connectedAt)}
                  </span>
                  <ul className={styles.onOffList} aria-label="What it can see">
                    {scopes.map(({ scope, on, label }) => (
                      <OnOffItem key={scope} on={on} label={label} />
                    ))}
                  </ul>
                  {scopes.some(({ on }) => !on) && (
                    <span className={styles.managementText}>
                      To allow more, disconnect it and connect it again.
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

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/button";
import { MCP_URL } from "@/lib/assistant-access";
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
 * signs the reader in through /connect/ the first time. Where the assistants
 * they've connected will be listed, to disconnect, when that's built.
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
          It searches London&apos;s screenings, films and venues as you. It
          can&apos;t see your lists or change anything on your account.
        </p>
      </section>
    </div>
  );
}

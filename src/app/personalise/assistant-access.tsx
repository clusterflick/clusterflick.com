"use client";

import { useEffect, useState } from "react";
import Button from "@/components/button";
import { MCP_URL } from "@/lib/assistant-access";
import { CapabilityId } from "@/lib/user-capabilities";
import { useUserContext } from "@/state/user-context";
import styles from "./page.module.css";

/**
 * For a reader with `assistantAccess`: the address to add to their AI
 * assistant, which signs them in through /connect/ the first time. Nothing
 * for anyone else, or if the capabilities can't be read, as the coming-soon
 * panel does: it's invitation-only, so it's never advertised.
 */
export default function AssistantAccess() {
  const { readCapabilities } = useUserContext();
  const [granted, setGranted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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
  }, [readCapabilities]);

  if (!granted) return null;

  const copy = () => {
    navigator.clipboard.writeText(MCP_URL).then(
      () => setCopied(true),
      (error) => console.error("Failed to copy the address", error),
    );
  };

  return (
    <aside className={styles.comingSoon} aria-labelledby="assistant-title">
      <h2 id="assistant-title" className={styles.comingSoonTitle}>
        AI assistant access
      </h2>
      <p className={styles.assistantText}>
        Your AI assistant can search Clusterflick&apos;s listings for you. Add
        this address to it as a custom connector, or MCP server, and sign in
        here when it asks:
      </p>
      <p className={styles.assistantAddress}>
        <code>{MCP_URL}</code>{" "}
        <Button variant="link" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </p>
    </aside>
  );
}

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/button";
import { getProfilePath } from "@/lib/user-profile";

/** The profile's full address, on whatever origin the page is served from. */
export function getProfileUrl(handle: string): string {
  return new URL(getProfilePath(handle), window.location.origin).href;
}

/**
 * Copies a profile's address, and says so for a moment. A browser that won't
 * let the page write to the clipboard is told to copy it from the address
 * bar instead, rather than nothing happening.
 */
export default function CopyLinkButton({
  handle,
  variant = "secondary",
}: {
  handle: string;
  variant?: "primary" | "secondary";
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getProfileUrl(handle));
      setState("copied");
    } catch (error) {
      console.error("Failed to copy the profile link", error);
      setState("failed");
    }
  };

  return (
    <Button variant={variant} size="sm" onClick={copy}>
      {state === "copied"
        ? "Link copied"
        : state === "failed"
          ? "Couldn't copy: use the address bar"
          : "Copy link"}
    </Button>
  );
}

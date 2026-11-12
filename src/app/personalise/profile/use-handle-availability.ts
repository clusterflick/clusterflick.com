"use client";

import { useEffect, useState } from "react";
import { useUserContext } from "@/state/user-context";

export type HandleAvailability =
  | "unchecked"
  | "yours"
  | "checking"
  | "free"
  | "taken"
  | "error";

/** Long enough that a word being typed isn't looked up letter by letter. */
const CHECK_DELAY_MS = 400;

/**
 * Whether a handle is free, checked as it's typed rather than on saving, so
 * the reader knows before they've filled in the rest. Only a handle with
 * nothing else wrong with it is looked up, and only once typing pauses; an
 * answer to a handle the field no longer holds is thrown away. Saving checks
 * again, since another reader can claim it in between.
 */
export function useHandleAvailability(
  handle: string,
  savedHandle: string | undefined,
  checkable: boolean,
): HandleAvailability {
  const { isHandleTaken } = useUserContext();
  const [result, setResult] = useState<{
    handle: string;
    availability: HandleAvailability;
  } | null>(null);

  const yours = handle === savedHandle;
  const shouldCheck = checkable && !yours;

  useEffect(() => {
    if (!shouldCheck) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      isHandleTaken(handle).then(
        (taken) =>
          !cancelled &&
          setResult({ handle, availability: taken ? "taken" : "free" }),
        (error) => {
          console.error("Failed to check handle", error);
          if (!cancelled) setResult({ handle, availability: "error" });
        },
      );
    }, CHECK_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [handle, shouldCheck, isHandleTaken]);

  if (yours) return "yours";
  if (!checkable) return "unchecked";
  return result?.handle === handle ? result.availability : "checking";
}

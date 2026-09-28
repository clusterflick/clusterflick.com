"use client";

import { useState } from "react";
import { useCinemaData } from "@/state/cinema-data-context";
import DataLoadNotice from ".";

/**
 * `DataLoadNotice` wired to the cinema data: shown while any movie chunk has
 * failed every retry. Lives in the root layout, since the dataset is shared by
 * every page and a gap in it affects all of them.
 */
export default function DataLoadNoticeClient() {
  const { failedFiles, isRetryingFailedFiles, retryFailedFiles } =
    useCinemaData();
  // Dismissal is tied to this set of failures: a retry that fails again hands
  // back a new array, and the reader who pressed it should hear the outcome.
  const [dismissedFor, setDismissedFor] = useState<string[] | null>(null);

  if (failedFiles.length === 0 || dismissedFor === failedFiles) return null;

  return (
    <DataLoadNotice
      onRetry={retryFailedFiles}
      isRetrying={isRetryingFailedFiles}
      onDismiss={() => setDismissedFor(failedFiles)}
    />
  );
}

/**
 * The settings' two status marks: a tick for something done or good (all
 * saved, a handle that's free), a pencil for changes waiting to be saved.
 * Drawn in `currentColor`; the class that places it also colours it.
 */
export default function StatusIcon({
  kind,
  className,
}: {
  kind: "done" | "pending";
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "done" ? (
        <path d="M5 12.5l4.5 4.5L19 7" />
      ) : (
        <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
      )}
    </svg>
  );
}

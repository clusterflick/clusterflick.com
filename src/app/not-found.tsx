import type { Metadata } from "next";
import NotFoundContent from "./not-found-content";

// Without its own metadata a 404 took the root layout's default title, the
// catalogue's, so a dead link showed "Every Film Showing in London" in the
// tab and anywhere it was shared. Next adds `noindex` to a 404 itself.
// The more specific titles inside (Festival Not Found and so on) are only
// known in the browser, so this is the generic one.
export const metadata: Metadata = {
  title: "Page Not Found",
  description: "We couldn't find that page. It may have been moved or removed.",
};

export default function NotFound() {
  return <NotFoundContent />;
}

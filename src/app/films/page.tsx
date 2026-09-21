import type { Metadata } from "next";
import CanonicalRedirect from "@/components/canonical-redirect";

export const metadata: Metadata = {
  title: "Moved to /catalogue",
  alternates: {
    canonical: "/catalogue",
  },
  robots: { index: false, follow: true },
};

/**
 * The catalogue lived here until it moved to /catalogue. Cloudflare answers
 * /films with a permanent redirect before this is ever served; this page is
 * the fallback should that rule go. It keeps the query string, since links
 * into /films carry filters (cast and crew links, venue and genre links), and
 * falls back to a meta refresh — which can't — for anyone without JavaScript.
 * Kept indefinitely: it costs nothing.
 */
export default function FilmsRedirectPage() {
  return (
    <>
      {/* Only without JavaScript: an immediate refresh would otherwise race
          the redirect below and win, dropping the query string. */}
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/catalogue/" />
      </noscript>
      <CanonicalRedirect canonicalUrl="/catalogue/" preserveQuery />
      <p>
        The films catalogue has moved to{" "}
        <a href="/catalogue/">clusterflick.com/catalogue</a>.
      </p>
    </>
  );
}

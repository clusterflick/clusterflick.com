import type { FC, ReactNode } from "react";
import Link from "next/link";

/** A named thing with its official (outbound) URL. */
export interface Ref {
  name: string;
  url: string;
}

/**
 * Link components injected into each entry's `body` at render time. They link
 * to the relevant Clusterflick page when one exists (a venue in the dataset, a
 * festival in the registry) and otherwise fall back to the outbound URL — see
 * the resolvers in `page.tsx`.
 */
export interface ChangeHelpers {
  /** A single venue: internal venue page if known, else outbound. */
  Venue: FC<Ref>;
  /** A comma-separated list of venues ("a, b and c"). */
  VenueList: FC<{ items: Ref[] }>;
  /** A festival: internal festival page if registered, else outbound. */
  Festival: FC<Ref>;
}

/** A plain outbound link, for things with no Clusterflick page (sources etc). */
function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export type ChangeTag =
  | "New venue"
  | "New source"
  | "New festival"
  | "New feature"
  | "Improvement"
  | "Under the hood";

const TAG_COLORS: Record<ChangeTag, "pink" | "blue" | "gray"> = {
  "New venue": "pink",
  "New source": "pink",
  "New festival": "pink",
  "New feature": "blue",
  Improvement: "blue",
  "Under the hood": "gray",
};

export function tagColor(tag: ChangeTag): "pink" | "blue" | "gray" {
  return TAG_COLORS[tag];
}

export interface Change {
  tag: ChangeTag;
  body: (helpers: ChangeHelpers) => ReactNode;
}

export interface ChangelogDay {
  /** ISO date (YYYY-MM-DD), used for the entry heading. */
  date: string;
  changes: Change[];
}

/**
 * The changelog, newest day first. A personal record of what's been shipped
 * across the Clusterflick site and its data pipeline.
 */
export const CHANGELOG: ChangelogDay[] = [
  {
    date: "2026-07-12",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            Added dedicated <Link href="/formats">format pages</Link>, so you
            can browse everything currently showing in a given format — 70mm,
            IMAX, and more — all in one place.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "Bush Theatre",
                  url: "https://www.bushtheatre.co.uk/whats-on/",
                },
                {
                  name: "Instituto Cervantes",
                  url: "https://londres.cervantes.es",
                },
              ]}
            />
            .
          </>
        ),
      },
      {
        tag: "New source",
        body: ({ Festival }) => (
          <>
            Started pulling in screenings from the{" "}
            <Ext href="https://japanesefilm.club/">Japanese Film Club</Ext> and
            from Col Films Limited (via Ticket Tailor), who programme as part of
            the{" "}
            <Festival
              name="London Colombian Film Festival"
              url="https://www.thelondoncolombianfilmfestival.com"
            />
            .
          </>
        ),
      },
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added the{" "}
            <Festival
              name="London Colombian Film Festival"
              url="https://www.thelondoncolombianfilmfestival.com"
            />{" "}
            (LCFF).
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The <Link href="/film-clubs">film clubs</Link> and{" "}
            <Link href="/festivals">festivals</Link> pages now filter more
            accurately, so each one better reflects what&apos;s actually on.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Reworked the navigation and filter display on the film page so they
            adapt cleanly across phone, tablet, and desktop.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-11",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            Clusterflick now records the <strong>format</strong> of each
            screening in its underlying data — including 70mm and IMAX
            presentations — and the site lets you filter films by format.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="St Mary's Church Walthamstow"
              url="https://www.stmaryswalthamstow.org"
            />
            .
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-10",
    changes: [
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "ESEA Community Centre",
                  url: "https://www.eseacommunitycentre.org.uk",
                },
                { name: "La Camionera", url: "https://www.lacamionera.com" },
                { name: "Lordship Hub Co-op", url: "https://lordshiphub.org" },
                { name: "MayDay Rooms", url: "https://maydayrooms.org" },
                { name: "The Showroom", url: "https://theshowroom.org" },
              ]}
            />
            .
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Made searching and filtering on the{" "}
            <Link href="/films">films page</Link> quicker and easier, with new
            convenience filter buttons and better spacing for the search bar on
            mobile.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-09",
    changes: [
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "The Antwerp Arms",
                  url: "https://www.antwerparms.co.uk",
                },
                { name: "Centre 151", url: "https://www.centre151.com" },
                {
                  name: "Reference Point",
                  url: "https://www.reference-point.uk",
                },
                {
                  name: "Shapes Lewisham",
                  url: "https://www.shapeslewisham.co.uk",
                },
                { name: "Spanners", url: "https://www.spanners.club" },
              ]}
            />
            .
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Added a &ldquo;Built with Clusterflick&rdquo; section to the{" "}
            <Link href="/about">About page</Link>, highlighting other sites that
            use our open data.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-08",
    changes: [
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "De Hems Dutch Cafe Bar",
                  url: "https://www.dehemspub.co.uk",
                },
                {
                  name: "The Victoria Dalston",
                  url: "https://www.jaguarshoes.com/pages/the-victoria",
                },
                { name: "The Black Eel", url: "https://www.theblackeel.uk" },
                {
                  name: "The Winchester",
                  url: "https://thewinchesterhighgate.co.uk",
                },
              ]}
            />
            .
          </>
        ),
      },
      {
        tag: "New source",
        body: () => (
          <>
            Added a new Ticket Tailor integration (and fixed its date parsing),
            which brings in a batch of independent film clubs and one-off
            events.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-07",
    changes: [
      {
        tag: "Improvement",
        body: () => (
          <>
            Enhanced the cinema group pages with a grid of film posters for
            what&apos;s showing across the group.
          </>
        ),
      },
      {
        tag: "Under the hood",
        body: () => (
          <>
            A round of website code improvements, including rendering a
            film&apos;s showings without needing JavaScript and standardising on
            a single list-virtualisation library.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-06",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            Added <Link href="/genres">genre pages</Link>, so you can browse
            what&apos;s on by genre.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Made film pages faster by virtualising the showings list, keeping
            long lists smooth to scroll.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Improved the{" "}
            <Link href="/near-me">&ldquo;Venues near me&rdquo;</Link> logic to
            exclude venues that have no upcoming screenings.
          </>
        ),
      },
    ],
  },
];

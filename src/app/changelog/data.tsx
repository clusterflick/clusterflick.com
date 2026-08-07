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
  | "New film club"
  | "New feature"
  | "Improvement"
  | "Under the hood";

const TAG_COLORS: Record<ChangeTag, "pink" | "blue" | "gray"> = {
  "New venue": "pink",
  "New source": "pink",
  "New festival": "pink",
  "New film club": "pink",
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
    date: "2026-08-07",
    changes: [
      {
        tag: "New film club",
        body: () => (
          <>
            Added <Link href="/film-clubs/midweek-cinema">Midweek Cinema</Link>,
            who put films on at 7pm from Monday to Thursday in pubs and bars
            around London.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="Heathcote & Star"
              url="https://heathcoteandstar.co.uk"
            />
            , a Leytonstone pub whose upstairs Grove Green Room hosts
            screenings.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-04",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            The <Link href="/films">filters</Link> can now hide sold out
            showings. Some venues tell us when a performance has gone, and
            switching this on drops those, so what&apos;s left is what you can
            still get into. It sits alongside &ldquo;Hide past showings&rdquo;,
            since both are asking the same thing — don&apos;t show me screenings
            I can&apos;t go to.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The <Link href="/films">filter panel</Link> is easier to follow
            while you work in it. The count of what your filters match is now
            the biggest thing in it rather than fine print, the summary line
            flashes when it changes so you notice it rewriting itself, the
            collapsed sections say what they do (&ldquo;Show Individual
            Venues&rdquo;) instead of sitting there looking like headings, and
            sharing your filters explains what the copied link actually does —
            showing you the link to copy by hand if the browser blocks the
            clipboard. &ldquo;Venues near me&rdquo; also says so when it finds
            nothing in range, rather than quietly emptying your results.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-02",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            There are now <Link href="/lists">film lists</Link> — the
            great-films lists critics and audiences keep arguing about, matched
            against what is actually screening in London. Ten of them to start:
            the <Link href="/lists/imdb-top-250">IMDb Top 250</Link>,{" "}
            <Link href="/lists/letterboxd-top-500">
              Letterboxd&apos;s Top 500
            </Link>
            ,{" "}
            <Link href="/lists/rt-best-of-all-time">
              Rotten Tomatoes&apos; 300 Best Movies of All Time
            </Link>{" "}
            and its <Link href="/lists/rt-100-percent-club">100% Club</Link>,{" "}
            <Link href="/lists/empire-100-greatest">
              Empire&apos;s 100 Greatest
            </Link>
            , the{" "}
            <Link href="/lists/guardian-100-best-21st-century">
              Guardian&apos;s best of the 21st century
            </Link>
            , and every winner of{" "}
            <Link href="/lists/oscar-best-picture">Best Picture</Link>,{" "}
            <Link href="/lists/oscar-best-international-feature">
              Best International Feature
            </Link>
            , the <Link href="/lists/palme-dor-winners">Palme d&apos;Or</Link>{" "}
            and the <Link href="/lists/golden-lion-winners">Golden Lion</Link>.
            Each page shows only the films you can still go and see, in the
            order they were ranked, and links back to whoever published the
            list.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            Film pages now show the lists a film appears on, with its position
            where the list is ranked — so{" "}
            <Link href="/movies/238/the-godfather">The Godfather</Link> tells
            you it is the Rotten Tomatoes number one and an Academy Award winner
            without you going looking.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-01",
    changes: [
      {
        tag: "New film club",
        body: () => (
          <>
            Added the{" "}
            <Link href="/film-clubs/waltham-forest-cinema-project">
              Waltham Forest Cinema Project
            </Link>
            , a community campaign to bring an independent cinema to the
            borough.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-31",
    changes: [
      {
        tag: "Improvement",
        body: () => (
          <>
            When a film is part of a <Link href="/festivals">festival</Link>,
            the film&apos;s page now says so with a proper card rather than a
            line of small print. The festival&apos;s logo, the dates it runs,
            and how many films and showings are in it, all linking through to
            the festival page.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Search is much less fussy about how you type a title. &ldquo;Pomp
            and Circumstance&rdquo; now finds &ldquo;Pomp &amp;
            Circumstance&rdquo;, &ldquo;The Godfather Part 2&rdquo; finds
            &ldquo;Part II&rdquo;, and &ldquo;101 Dalmatians&rdquo; and
            &ldquo;One Hundred and One Dalmatians&rdquo; each turn up the other.
            Ampersands, roman numerals, spelled-out numbers, fractions like
            8&frac12;, abbreviations like Dr and Doctor, and any stray brackets
            or punctuation sitting in a title are all handled now.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-27",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            There&apos;s now an <Link href="/updates">updates page</Link>,
            showing what&apos;s just landed in the listings — films appearing
            for the first time, extra showings for ones already playing, and
            newly added venues. It&apos;s grouped by each refresh, so you can
            see what changed and exactly when.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            The updates page has an{" "}
            <a href="/updates/feed.xml" target="_blank">
              RSS feed
            </a>
            , if you&apos;d rather hear about new screenings without visiting
            the site. Each entry in the feed matches a section on the page.
          </>
        ),
      },
      {
        tag: "Under the hood",
        body: () => (
          <>
            Every refresh of the listings now{" "}
            <a
              href="https://github.com/clusterflick/data-diffed/"
              target="_blank"
            >
              publishes a record of what changed in it
            </a>
            , alongside the listings themselves. That&apos;s what the updates
            page and its feed are built from.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-25",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            <Link href="/formats/imax-70mm">IMAX 70mm</Link> is now tracked as a
            format in its own right, separate from{" "}
            <Link href="/formats/70mm">70mm</Link>. The 15-perf print running
            sideways through the projector is a different beast to a standard
            70mm one, so the two are no longer lumped together — and you can
            filter for either on its own.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The <Link href="/formats">formats page</Link> is now split into what
            a screening is played from and how it&apos;s presented, so it&apos;s
            clearer that an IMAX ticket tells you about the auditorium rather
            than what&apos;s in the projector. Closely related formats also link
            across to each other now, in case you landed on the wrong one.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-19",
    changes: [
      {
        tag: "Under the hood",
        body: ({ Venue }) => (
          <>
            Screenings at{" "}
            <Venue
              name="BFI Southbank"
              url="https://www.bfi.org.uk/bfi-southbank"
            />{" "}
            and <Venue name="BFI IMAX" url="https://www.bfi.org.uk/bfi-imax" />{" "}
            now come through more completely. Malformed links on BFI&apos;s own
            site caused some performances to be dropped. BFI Southbank data is
            now pulled from two of BFI&apos;s listing sources at once; anything
            omitted on one is caught by the other.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-17",
    changes: [
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "Angel Community Centre",
                  url: "https://www.enfield.gov.uk/services/leisure-and-culture/community-halls/angel-community-centre",
                },
                {
                  name: "Bernie Grant Arts Centre",
                  url: "https://www.berniegrantcentre.co.uk",
                },
                {
                  name: "The Brookmill",
                  url: "https://www.thebrookmill.co.uk",
                },
                {
                  name: "Camouflage Cafe",
                  url: "https://camouflagecafe.co.uk",
                },
                { name: "Conway Hall", url: "https://www.conwayhall.org.uk" },
                { name: "EartH", url: "https://earthackney.co.uk" },
                {
                  name: "Greenford Quay",
                  url: "https://www.greenfordquay.com/events",
                },
                {
                  name: "Harris Institute of Teaching and Leadership",
                  url: "https://www.harrisinstitute.org.uk",
                },
                { name: "Ladbroke Hall", url: "https://ladbrokehall.com" },
              ]}
            />
            .
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-16",
    changes: [
      {
        tag: "Improvement",
        body: () => (
          <>
            Jumping into the film catalogue list from a{" "}
            <Link href="/formats">format</Link>,{" "}
            <Link href="/genres">genre</Link> or{" "}
            <Link href="/venues">venue</Link> page now starts from a clean
            slate. Before, a filter picked up on an earlier page could quietly
            stick, so exploring — say — 35mm films just after browsing a single
            venue could leave you staring at an empty list.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The one-tap quick filters — &ldquo;what&apos;s on near me
            today&rdquo;, &ldquo;what&apos;s on this week&rdquo; and &ldquo;show
            me everything&rdquo; — now highlight when the current view matches
            one, so it&apos;s clear at a glance which you&apos;ve got applied.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-14",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            Every <Link href="/venues">venue page</Link> now opens with a
            timetable of today&apos;s and tomorrow&apos;s screenings, listed by
            start time like a cinema&apos;s lobby board, so you can see
            what&apos;s on right now without hunting through a grid of posters.
            Venues that have added screenings in the past week also get a
            &ldquo;just added&rdquo; row highlighting what&apos;s new.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            You can now filter by time of day as well as by date — morning,
            afternoon, evening, late, or a specific range you choose. It
            combines with the date filter, so &ldquo;mornings over the next
            week&rdquo; is now a single search.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            Added a quick venue search to the filters, so you can type a
            cinema&apos;s name and toggle it on or off without scrolling the
            full list of London venues.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The side menu now scrolls on shorter screens, so its lower entries
            stay reachable on smaller phones.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-07-13",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            The <Link href="/venues">venues page</Link> now opens with an
            interactive map of every London cinema. Filtering the list narrows
            the map with it, each pin links through to the venue, and if
            you&apos;ve shared your location a marker shows where you are.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            The <Link href="/near-me">near you</Link> page now leads with a map
            of the cinemas within two miles, drawn with 1- and 2-mile distance
            rings around your location so you can see what&apos;s genuinely
            close.
          </>
        ),
      },
      {
        tag: "Under the hood",
        body: () => (
          <>
            Each deploy now pings{" "}
            <Ext href="https://www.indexnow.org/">IndexNow</Ext> with the pages
            that changed, so search engines pick up new listings sooner rather
            than waiting to recrawl.
          </>
        ),
      },
    ],
  },
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

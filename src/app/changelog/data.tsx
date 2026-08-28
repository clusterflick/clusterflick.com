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
    date: "2026-08-28",
    changes: [
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added{" "}
            <Festival name="FrightFest" url="https://www.frightfest.co.uk" />,
            &ldquo;the UK&rsquo;s No.1 horror &amp; fantasy film festival&rdquo;
            &mdash; founded in 2000 at the Prince Charles Cinema to give the UK
            an answer to Sitges and Brussels, and now an annual takeover of
            Leicester Square across the August bank holiday weekend. The 27th
            edition runs 27 to 31 August at the ODEON Luxe Leicester Square and
            ODEON Luxe West End, with eighty-two features across five screens.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-26",
    changes: [
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added{" "}
            <Festival
              name="Tibet Film Festival London"
              url="https://www.tibetfilmfestival.org/london"
            />
            , the London edition of what calls itself the only film festival
            featuring contemporary Tibetan cinema — founded in Z&uuml;rich in
            2009, brought here in 2019 by Kunsang Kelden and Dechen Pemba, and
            run by volunteers who have moved it from Deptford Cinema to the
            Genesis, the Rio and beyond. The 2026 edition runs 25 to 27
            September.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-25",
    changes: [
      {
        tag: "New film club",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Link href="/film-clubs/never-watching-movies">
              Never Watching Movies
            </Link>
            , diaspora film curated by Zain Gibson, social media manager at the{" "}
            <Venue name="Rio Cinema" url="https://riocinema.org.uk" /> and one
            of several clubs the Rio&apos;s own staff run out of the building.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-24",
    changes: [
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added{" "}
            <Festival
              name="The South London Film Festival"
              url="https://www.southlondonfilmfest.co.uk/"
            />
            , the not-for-profit that calls itself the official film festival of
            South London and runs at the Ritzy in Brixton from 12 to 27
            September — an official awards showcase, UK premieres and live
            Q&amp;As, programmed from open submissions that are free to enter
            for students.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-23",
    changes: [
      {
        tag: "New venue",
        body: ({ VenueList }) => (
          <>
            Added{" "}
            <VenueList
              items={[
                {
                  name: "Perivale Community Hive",
                  url: "https://perivalehive.co.uk",
                },
                {
                  name: "Shoreditch Library",
                  url: "https://hackney.gov.uk/shoreditch-library/",
                },
                {
                  name: "North Kensington Library",
                  url: "https://www.rbkc.gov.uk/libraries-0/your-local-library/north-kensington-library",
                },
                {
                  name: "Whitton Library",
                  url: "https://www.richmond.gov.uk/whitton_library",
                },
                {
                  name: "Leyton Library",
                  url: "https://www.walthamforest.gov.uk/libraries/local-libraries/leyton-library",
                },
                {
                  name: "Leytonstone Library",
                  url: "https://www.walthamforest.gov.uk/libraries/local-libraries/leytonstone-library",
                },
              ]}
            />
            , six London libraries with a film club going on between the shelves
            — classic films and National Theatre broadcasts in Hoxton, heritage
            month seasons on Ladbroke Grove, a festival of shorts in Whitton,
            kids&apos; clubs either side of Leyton, and Silver Screenings at the
            volunteer-run library Perivale rescued for itself.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added <Venue name="Union Chapel" url="https://unionchapel.org.uk" />
            , the Islington chapel that is a working church, an award-winning
            music venue and a homelessness charity at once, and where the Ocean
            and Banff mountain film festivals pitch up on tour.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="Building Centre"
              url="https://www.buildingcentre.co.uk"
            />
            , the built-environment gallery on Store Street, where a new film
            club screens films about architecture and urban life — it opened
            with Tati&apos;s Playtime.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue name="Algha's Plantroom" url="https://www.plantroom.space" />
            , a cultural space on the second floor of Algha Works on Fish
            Island, home to Blackney Wick Film Club and its themed nights of
            film and sound system.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue name="HKUK Kingston Community Centre" url="https://hk.uk" />,
            the old Kingston telephone exchange turned community centre by Hong
            Kongers who had recently moved to the area, screening
            Cantonese-language films with Q&amp;As.
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
                  name: "Greener and Cleaner",
                  url: "https://www.greenerandcleaner.co.uk",
                },
                {
                  name: "Morland Community Hall",
                  url: "https://communityhalls.hackney.gov.uk/venues/19-morland-community-hall",
                },
              ]}
            />
            , a sustainability hub tucked into a Bromley shopping centre running
            an environmental film cafe, and a Hackney estate hall where the
            residents run their own film club.
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
                  name: "Langthorne Park",
                  url: "https://www.walthamforest.gov.uk/libraries-arts-parks-and-leisure/parks-and-open-spaces/langthorne-park",
                },
                {
                  name: "Stoneydown Park",
                  url: "https://www.walthamforest.gov.uk/libraries-arts-parks-and-leisure/parks-and-open-spaces/our-other-parks",
                },
              ]}
            />
            , two Waltham Forest parks where Stow Film Lounge sets up its
            open-air cinema over the summer — an amphitheatre in Leytonstone
            named after a long-gone Stratford abbey, and Walthamstow&apos;s
            ornamental gardens off Pretoria Avenue.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="Alexandra Palace Theatre"
              url="https://www.alexandrapalace.com/theatre/"
            />
            , the Victorian auditorium on the hill in Haringey that spent a
            stint as a cinema, then eighty years shut and quietly decaying,
            before reopening with the decay left on show — films turn up there
            played to a live band.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="Ognisko Polskie"
              url="https://www.ogniskopolskie.org.uk"
            />
            , the Polish Hearth Club in South Kensington, open since 1939, whose
            KinoKlub shows recent Polish cinema in the ballroom with dinner
            beforehand.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="The Well Walk Theatre"
              url="https://www.thewellwalktheatre.com"
            />
            , a 50-seat family theatre, bookshop and cafe in Hampstead, where
            the Cine Club runs vintage animation and silent-era films with live
            musical accompaniment.
          </>
        ),
      },
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added <Venue name="The Mildmay Club" url="https://mildmay.club" />,
            the Newington Green members&apos; club that has been radical since
            1888 and on screen ever since — the Krays films, Vera Drake, Made in
            Dagenham — and now shows the occasional film of its own.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-21",
    changes: [
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue name="Big Penny Social" url="https://bigpennysocial.co.uk" />
            , the Walthamstow beer hall and events space in the old
            Truman&apos;s Social Club, where Deeper Into Movies puts on family
            screenings and music documentaries.
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
                  name: "Bojangles Brasserie",
                  url: "https://wearebojangles.com",
                },
                {
                  name: "Green Alley Studios",
                  url: "https://www.instagram.com/green_alley_studios",
                },
                {
                  name: "Orchard Dry Dock",
                  url: "https://www.goodluckhope.com",
                },
                { name: "Oslo Hackney", url: "https://www.oslohackney.com" },
                {
                  name: "Polish Social and Cultural Association POSK",
                  url: "https://posk.org",
                },
                { name: "The Bedford", url: "https://thebedford.com" },
                {
                  name: "The Cyprus High Commission",
                  url: "http://www.cyprusinuk.com",
                },
                {
                  name: "The Griffin",
                  url: "https://www.griffinwhetstone.pub",
                },
                {
                  name: "Tower Bridge Collective",
                  url: "https://towerbridgecollective.co.uk",
                },
                {
                  name: "Upminster Windmill",
                  url: "https://www.upminsterwindmill.org",
                },
              ]}
            />
            , ten more places whose screenings only ever surface on the
            ticketing platforms — among them a Grade II* smock mill running
            outdoor cinema under its sails, the largest Polish centre in Western
            Europe, a rediscovered dry dock at the mouth of the Lea, and the
            Cyprus High Commission&apos;s nights of Cypriot film in St
            James&apos;s Square.
          </>
        ),
      },
      {
        tag: "New film club",
        body: ({ Venue }) => (
          <>
            Added <Link href="/film-clubs/reel-talk">Reel Talk</Link>, East
            Croydon Cool&apos;s sociable film club for locals who like bold
            movies and big conversations, run in partnership with the{" "}
            <Venue
              name="David Lean Cinema"
              url="https://www.davidleancinema.org.uk"
            />
            . Hosts Pilar Nalwimba and Louis Holder bookend the screening with a
            conversation about the film, and the audience carries it on
            afterwards over drinks — a one-word review board, a postcard collage
            station, and a video rental store where you crack open a tape with a
            stranger and answer the question inside.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            &ldquo;More Than a Screening&rdquo; on the{" "}
            <Link href="/">home page</Link> picks out the nights that are more
            than the film — a Q&amp;A with someone who made it, a silent with a
            live score, a first UK showing. Cinemas only ever mention these in
            passing in a listing&apos;s small print, so they are read out of the
            listings themselves and ranked by how rare they actually are: an
            introduction is worth noticing at a cinema that rarely gives one and
            not at a cinema that always does, and one Q&amp;A among a
            film&apos;s fifty showings is a genuinely different evening.
            Sold-out nights are left out — there is no point pointing at a door
            you can&apos;t get through.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            Marathons and double bills now say which{" "}
            <Link href="/collections">collection</Link> they belong to, the way
            a single film always has.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-20",
    changes: [
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added the{" "}
            <Festival
              name="Hong Kong Film Festival UK"
              url="https://www.hkff.uk"
            />
            , the diaspora-led festival of Hong Kong and East and Southeast
            Asian cinema, whose fourth edition runs 25 September to 4 October
            across eleven London venues — its biggest programme yet, with
            seventeen UK premieres alongside restored classics and experimental
            work.
          </>
        ),
      },
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added five more festivals with programmes coming up —{" "}
            <Festival
              name="Kino London Short Film Festival"
              url="https://www.kinoshortfilm.com"
            />
            , a BIFA qualifier built around shorts by emerging filmmakers;{" "}
            <Festival
              name="Fringe! Queer Film & Arts Fest"
              url="https://www.fringefilmfest.com"
            />
            , volunteer-run and free or cheap to get into since 2011;{" "}
            <Festival
              name="The Fighting Spirit Film Festival"
              url="https://www.fightingspiritfilmfestival.com"
            />
            , one of the few festivals anywhere given over to martial arts and
            action cinema;{" "}
            <Festival
              name="Ukrainian Film Festival"
              url="https://uil.org.uk/ukrainian-film-festival/"
            />
            , the Ukrainian Institute London&apos;s yearly run at Curzon Soho;
            and{" "}
            <Festival
              name="Wine Dark Short Film Festival"
              url="https://www.winedark.co.uk/wine-dark-short-film-festival"
            />
            , London&apos;s first festival of shorts made by D/deaf, disabled
            and neurodivergent teams.
          </>
        ),
      },
      {
        tag: "New film club",
        body: () => (
          <>
            Added{" "}
            <Link href="/film-clubs/lucilas-film-club">
              Lucila&apos;s Film Club
            </Link>
            , a female-directors-only movie night run by fashion designer Lucila
            Safdie and her best friend June, which started out at the Genesis
            Cinema in east London.
          </>
        ),
      },
      {
        tag: "New film club",
        body: () => (
          <>
            Added{" "}
            <Link href="/film-clubs/deeper-into-movies">
              Deeper Into Movies
            </Link>
            , which grew out of Steven T Hanley&apos;s VHS screenings in London
            dive bars into regular nights at The Haggerston and Screen on the
            Green — contemporary cinema and overlooked gems, often with a
            lecture or a live score alongside the film.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            A film&apos;s page now shows its original title too (where that
            differs from the English one) — Amélie shows its original French
            title{" "}
            <em>&ldquo;Le Fabuleux Destin d&apos;Amélie Poulain&rdquo;</em> too
            — along with the language it was made in.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            <Link href="/films">Searching</Link> looks at original titles too so
            you don&apos;t have to reach for whatever it was called in English —{" "}
            <em>&ldquo;Fabuleux&rdquo;</em> finds Amélie.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-17",
    changes: [
      {
        tag: "New film club",
        body: () => (
          <>
            Added <Link href="/film-clubs/taste-film">Taste Film</Link>, an
            immersive dining experience that pairs a tasting menu with a
            screening, each course arriving as its scene does. Founded by former
            Film Studies teacher Amy Fernando, who had the idea watching the
            prison cooking scene in Goodfellas.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-16",
    changes: [
      {
        tag: "New source",
        body: () => (
          <>
            Started pulling in screenings from{" "}
            <Ext href="https://www.wegottickets.com">WeGotTickets</Ext>, the
            independent ticket agency.
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
                  name: "Poppy's Funerals",
                  url: "https://www.poppysfunerals.co.uk",
                },
                {
                  name: "Raynes Park Community Church",
                  url: "https://www.salvationarmy.org.uk/raynes-park",
                },
                {
                  name: "Ruach City Church",
                  url: "https://www.ruachcitychurch.org",
                },
                {
                  name: "St George's Garrison Church",
                  url: "https://www.stgeorgeswoolwich.org",
                },
                {
                  name: "St Leonard's Church Hall",
                  url: "https://stleonard-streatham.org.uk",
                },
                {
                  name: "The Carpet Shop",
                  url: "https://linktr.ee/thecarpetshoppeckham",
                },
                {
                  name: "The Cavern",
                  url: "http://www.thecavernfreehouse.co.uk",
                },
                {
                  name: "The Leather Bottle",
                  url: "https://www.greeneking.co.uk/pubs/greater-london/leather-bottle",
                },
                {
                  name: "The Man of Kent",
                  url: "https://www.facebook.com/p/The-Man-of-Kent-100068349115605/",
                },
                {
                  name: "The Manor Arms",
                  url: "https://www.themanorarms.com",
                },
              ]}
            />
            , ten more rooms taken over by this year&apos;s Free Film Festivals
            — four pubs and four churches and church halls, plus a railway-arch
            club on Rye Lane and a funeral director in Raynes Park.
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
                  name: "All Saints Kingston",
                  url: "https://allsaintskingston.co.uk",
                },
                {
                  name: "Bethnal Green Nature Reserve",
                  url: "https://bethnalgreennaturereserve.org",
                },
                {
                  name: "The cornerHOUSE Community Arts Centre",
                  url: "https://www.thecornerhouse.org",
                },
                {
                  name: "The Mud Room",
                  url: "https://themudroomlondon.com",
                },
                {
                  name: "The Rookery",
                  url: "https://www.sccoop.org.uk",
                },
                {
                  name: "The White Lion Pub",
                  url: "https://www.whitelionsw16.co.uk",
                },
                {
                  name: "Tooting Bec Lido",
                  url: "https://www.placesleisure.org/centres/tooting-bec-lido/",
                },
                {
                  name: "Waterhouse Hall Theatre",
                  url: "https://winchmorehillurc.co.uk",
                },
                {
                  name: "Watson's General Telegraph",
                  url: "https://www.watsonstelegraph.pub",
                },
                {
                  name: "West Wimbledon Hall",
                  url: "https://www.westwimbledonsociety.org",
                },
              ]}
            />
            , and ten more after that — a volunteer arts centre in Surbiton, a
            community cinema in a Winchmore Hill church hall, and a
            summer&apos;s worth of screenings in a lido, a walled garden, a wild
            churchyard and a doggy daycare.
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
                  name: "Lost Souls Pizza",
                  url: "https://lostsoulspizza.com",
                },
                {
                  name: "Love Affair Basement",
                  url: "https://www.loveaffairbasement.co.uk",
                },
                {
                  name: "Oxford House",
                  url: "https://www.oxfordhouse.org.uk",
                },
                {
                  name: "The Common Press Dalston",
                  url: "https://www.commonpress.co.uk",
                },
                {
                  name: "Wheatsheaf Community Hall",
                  url: "https://www.wheatsheafhall.org.uk",
                },
              ]}
            />
            , five more rooms that put films on between everything else they do
            — a vampire-themed pizzeria in Camden, a queer basement bar on
            Hackney Road, a volunteer-run hall in Vauxhall, the settlement house
            Bethnal Green has had since 1884, and a second Common Press in
            Dalston.
          </>
        ),
      },
      {
        tag: "Under the hood",
        body: ({ Venue }) => (
          <>
            Now that there are two of them,{" "}
            <Venue
              name="The Common Press Shoreditch"
              url="https://www.commonpress.co.uk"
            />{" "}
            is grouped with its Dalston sibling. Its calendar file is now named
            &quot;commonpress.co.uk-shoreditch&quot; rather than
            &quot;commonpress.co.uk&quot;, so anyone subscribed to the old URL
            will need to resubscribe.
          </>
        ),
      },
      {
        tag: "Under the hood",
        body: ({ VenueList }) => (
          <>
            A screening a venue lists itself no longer appears twice when a
            ticketing source turns up the showing.{" "}
            <VenueList
              items={[
                {
                  name: "The Cinema Museum",
                  url: "http://www.cinemamuseum.org.uk",
                },
                {
                  name: "The Horse Hospital",
                  url: "https://www.thehorsehospital.com",
                },
                { name: "Rio Cinema", url: "https://riocinema.org.uk" },
              ]}
            />{" "}
            all had duplicates — Eventbrite, Outsavvy, DICE — and these are now
            matched, preferring linking to the venue&apos;s page.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-15",
    changes: [
      {
        tag: "New source",
        body: () => (
          <>
            Started pulling in screenings from{" "}
            <Ext href="https://gel.now">gel</Ext>, a listings site for
            London&apos;s grassroots events — mostly gigs, club nights and
            talks, but with film scattered through it, from one-off screenings
            at cinemas to films put on in bookshops, studios and community
            halls.
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
                  name: "Brenchley Gardens Community Centre",
                  url: "https://www.southwark.gov.uk/housing/tenant-homeowner-and-community-groups/tenant-management-organisations-tmos/southwark-tmos#brenchley-gardens-tmc--2",
                },
                {
                  name: "Buchan Tenants and Residents Hall",
                  url: "https://www.instagram.com/buchanhall/",
                },
                {
                  name: "Christ Church Peckham",
                  url: "https://www.christchurchpeckham.org",
                },
                {
                  name: "Cossall Community Hall",
                  url: "https://cossallresidents.wordpress.com",
                },
                { name: "El Chico's", url: "https://www.elchicos.co.uk" },
                {
                  name: "Fortune Green",
                  url: "http://www.fortunegreen.org.uk",
                },
                {
                  name: "Hillside Gardens Park",
                  url: "https://hillsidegardenspark.co.uk",
                },
                {
                  name: "LEX2 Livesey Exchange",
                  url: "https://www.liveseyexchange.com",
                },
                { name: "Love & Dye", url: "https://www.loveanddye.com" },
                { name: "Peckham Palms", url: "https://peckhampalms.com" },
              ]}
            />
            , ten more estate halls, parks, churches and neighbourhood
            businesses lending their rooms to this year&apos;s Free Film
            Festivals — a Mexican restaurant, a hair salon and a Black-owned
            beauty arcade among them.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-13",
    changes: [
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added <Venue name="Ibraaz" url="https://ibraaz.org" />, a Fitzrovia
            arts centre for culture and ideas from the Global Majority, whose
            screenings happen in Minassa, the cinema room in its basement.
          </>
        ),
      },
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added the four Free Film Festivals with programmes coming up —{" "}
            <Festival
              name="Peckham & Nunhead Free Film Festival"
              url="https://freefilmfestivals.org/filmfestival/peckham-nunhead/"
            />
            ,{" "}
            <Festival
              name="Streatham Free Film Festival"
              url="https://freefilmfestivals.org/filmfestival/streatham/"
            />
            ,{" "}
            <Festival
              name="Raynes Park Free Film Festival"
              url="https://freefilmfestivals.org/filmfestival/raynes-park/"
            />{" "}
            and{" "}
            <Festival
              name="West Norwood Free Film Festival"
              url="https://freefilmfestivals.org/filmfestival/west-norwood/"
            />
            . Each has its own page gathering that neighbourhood&apos;s
            screenings, wherever in the area they happen to be.
          </>
        ),
      },
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added the{" "}
            <Festival
              name="London Latino Film Festival"
              url="https://londonlatinofilmfestival.org.uk/"
            />
            , whose first edition runs 2–6 October with sixty features and
            shorts from across Latin America and its diasporas, spread over
            multiple venues.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            <Link href="/updates">New Listings</Link> is a page per day now,
            rather than one long scroll of everything from the past fortnight.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-12",
    changes: [
      {
        tag: "New source",
        body: () => (
          <>
            Started pulling in screenings from{" "}
            <Ext href="https://freefilmfestivals.org">Free Film Festivals</Ext>,
            the volunteer-run network behind neighbourhood festivals across
            London — every screening free to attend, in whatever hall, park or
            pub will have them.
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
                { name: "AMP Studios", url: "https://ampstudios.co.uk" },
                {
                  name: "Batch & Co. Coffee",
                  url: "https://powku1.wixsite.com/batchandco",
                },
                {
                  name: "Mountview Academy of Theatre Arts",
                  url: "https://www.mountview.org.uk",
                },
                { name: "Nunhead Cemetery", url: "https://www.fonc.org.uk" },
                {
                  name: "St Matthew's Church",
                  url: "https://www.stmatthewswimbledon.org",
                },
                {
                  name: "Streatham Library",
                  url: "https://www.lambeth.gov.uk/libraries-0/streatham-library",
                },
                {
                  name: "The British Home",
                  url: "https://britishhome.org.uk",
                },
                {
                  name: "The Woodfield Pavilion",
                  url: "https://www.thewoodfield.org",
                },
              ]}
            />
            , a set of South London halls, cafés, libraries and green spaces
            that open up for free film screenings.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: ({ Venue }) => (
          <>
            <Venue
              name="RAF Museum"
              url="https://www.rafmuseum.org.uk/london/"
            />{" "}
            now has its listings read straight from its Propellers &amp; Popcorn
            page, so its open-air screenings on the airfield are now included.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-09",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            A film that has finished its run keeps its page. Until now, once the
            last screening had been and gone the film dropped out of the
            listings entirely and took its page with it, so an old link — or a
            search result, or a bookmark — landed on nothing with a 404. The
            page is still there now, with the poster and details. Where the
            showings used to be it tells you it&apos;s not currently screening
            in London, when it last played, and points you at{" "}
            <Link href="/films">what&apos;s on</Link>. If it comes back, the
            page fills back in with performances.
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-08",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            Every <Link href="/venues">venue</Link> now has a calendar page,
            showing its whole programme laid out month by month or as an agenda.
            It&apos;s built from the same calendar file you can subscribe to
            from the venue page, so what you see here is exactly what turns up
            in your own calendar app.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            Every page now carries the full navigation. There&apos;s also a
            footer on every page listing everywhere you can go, grouped the same
            way the menu is.
          </>
        ),
      },
      {
        tag: "Improvement",
        body: () => (
          <>
            The navigation is grouped now, and a few things are renamed to say
            what they actually are. &ldquo;Updates&rdquo; is{" "}
            <Link href="/updates">New Listings</Link>, since it&apos;s new films
            and showings rather than changes to the site — that&apos;s this
            page, which is in the menu now too, along with{" "}
            <Link href="/">Home</Link>. &ldquo;Collections&rdquo; is{" "}
            <Link href="/collections">Franchises &amp; Series</Link>, which is
            what&apos;s on those pages and no longer reads as a synonym for{" "}
            <Link href="/lists">Film Lists</Link>. And
            &ldquo;Accessibility&rdquo; is{" "}
            <Link href="/accessibility">Accessible Screenings</Link> — it lists
            screenings you can go to, not a statement about the website.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            When your <Link href="/films">search or filters</Link> come up
            empty, the page now suggests what would work instead of leaving you
            to guess — each suggestion saying how many results it would give
            you, and applying in one tap. It&apos;ll offer a correction when a
            title looks mistyped, point out when what you typed matches against
            a different value (the venue&apos;s own title for a screening, or a
            note on a performance) and name the filter that&apos;s actually in
            the way (which is usually the date window or a category you&apos;d
            forgotten was narrowed).
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            Search suggestions also spot when what you typed is a filter rather
            than a film. Searching &ldquo;70mm&rdquo; offers both 70mm and IMAX
            70mm as formats, with a count each; the same goes for genres, event
            types (like quizzes), and accessibility features (like subtitles).
          </>
        ),
      },
    ],
  },
  {
    date: "2026-08-07",
    changes: [
      {
        tag: "New feature",
        body: () => (
          <>
            There are now <Link href="/collections">film collections</Link> —
            franchises like Lord of the Rings, Star Wars and The Godfather, laid
            out in release order so you can see the whole run at once: what you
            can still catch, and what you have already missed. A collection gets
            a page while two or more of its films are on, and a film playing
            inside a double bill or marathon counts too — its poster points at
            the event.
          </>
        ),
      },
      {
        tag: "New feature",
        body: () => (
          <>
            Film pages now say which collection a film belongs to, so one Star
            Wars film points you at the other eight without you going looking
            for them.
          </>
        ),
      },
      {
        tag: "New festival",
        body: ({ Festival }) => (
          <>
            Added{" "}
            <Festival
              name="The Shortest Nights Film Festival"
              url="https://www.shortsightedcinema.com/theshortestnightsfestival2026"
            />
            , a BIFA-qualifying weekend of new British short films from Short
            Sighted Cinema.
          </>
        ),
      },
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
      {
        tag: "New venue",
        body: ({ Venue }) => (
          <>
            Added{" "}
            <Venue
              name="Canal Film Club"
              url="https://www.instagram.com/canalfilmclub/"
            />
            , a DIY queer collective running pop-up B-movie screenings and DJ
            parties in a secret woodland by the East London canal.
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

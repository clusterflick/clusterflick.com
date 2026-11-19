import {
  LetterboxdIcon,
  InstagramIcon,
  RedditIcon,
  ThreadsIcon,
  XIcon,
  BlueskyIcon,
} from "@/components/icons";
import { FILM_CLUBS } from "@clusterflick/catalogue/data/film-clubs";
import { FESTIVALS } from "@clusterflick/catalogue/data/festivals";

export const socialLinks = [
  {
    Icon: LetterboxdIcon,
    name: "Letterboxd",
    url: "https://letterboxd.com/clusterflick/",
    handle: (
      <>
        letterboxd.com/<strong>clusterflick</strong>
      </>
    ),
  },
  {
    Icon: InstagramIcon,
    name: "Instagram",
    url: "https://www.instagram.com/clusterflick_/",
    handle: (
      <>
        instagram.com/<strong>clusterflick_</strong>
      </>
    ),
  },
  {
    Icon: RedditIcon,
    name: "Reddit",
    url: "https://www.reddit.com/user/clusterflick_/",
    handle: (
      <>
        reddit.com/user/<strong>clusterflick_</strong>
      </>
    ),
  },
  {
    Icon: ThreadsIcon,
    name: "Threads",
    url: "https://www.threads.com/clusterflick_/",
    handle: (
      <>
        threads.com/<strong>clusterflick_</strong>
      </>
    ),
  },
  {
    Icon: XIcon,
    name: "X / Twitter",
    url: "https://x.com/clusterflick/",
    handle: (
      <>
        x.com/<strong>clusterflick</strong>
      </>
    ),
  },
  {
    Icon: BlueskyIcon,
    name: "Bluesky",
    url: "https://bsky.app/profile/clusterflick.bsky.social",
    handle: (
      <>
        bsky.app/profile/<strong>clusterflick</strong>.<wbr />
        bsky.social
      </>
    ),
  },
];

interface PartnerSite {
  name: string;
  description: string;
  url: string;
  // Only a site's own mark; without one the card shows its initial instead
  logo?: string;
}

export const partnerSites: PartnerSite[] = [
  {
    name: "CultureCity.London",
    description:
      "A comprehensive guide to London's vast and diverse cultural events scene.",
    url: "https://culturecity.london",
    logo: "/images/partners/culturecity.jpg",
  },
  {
    name: "FilmHose",
    description:
      "Showtimes for art house films and repertory screenings across London's independent cinema scene.",
    url: "https://filmhose.uk",
    logo: "/images/partners/filmhose.svg",
  },
  {
    name: "Every Cinema London",
    description:
      "London showtimes in one place, browsable by film or pivoted by venue and date.",
    url: "https://everycinema.london",
    logo: "/images/partners/everycinema.svg",
  },
  {
    name: "Cultur Vultur",
    description:
      "Q&As, filmmaker talks, premieres and special screenings at London cinemas.",
    url: "https://culturvultur.com",
    logo: "/images/partners/culturvultur.svg",
  },
  {
    name: "Cartelita",
    description:
      "Jazz, theatre and film listings for several cities, including London's independent and repertory cinemas.",
    url: "https://cartelita.july.dev/london/en/film",
  },
  {
    name: "PicHouse",
    description:
      "Picturehouse Screen 1 showtimes and every bookable BFI IMAX screening, with trailers.",
    url: "https://pichouse-ssr.pages.dev",
  },
  {
    name: "WhatsPlaying",
    description:
      "London screenings you can get to, watch, and still be home in time.",
    url: "https://aduncan2.github.io/whats-playing/",
    logo: "/images/partners/whatsplaying.png",
  },
];

interface Feature {
  title: string;
  description: string;
  href: string;
}

interface Reason {
  title: string;
  description: string;
  href: string;
  /** The lead reasons end on a text link, so it says where it goes. */
  linkLabel?: string;
}

// Why Clusterflick rather than another guide, under the hero's claim. The
// lead three are what no other guide does; the rest back them up beneath.
export const leadReasons: Reason[] = [
  {
    title: "Nothing Slips Through",
    description:
      "We gather every venue's own listings and every ticketing and events site it sells through, then combine them, so a showing listed in only one place still turns up. And not just cinemas: the pubs, churches, libraries and community halls that screen films too.",
    href: "/venues",
    linkLabel: "See the venues",
  },
  {
    title: "More Than the Listing Says",
    description:
      "We read each listing's title, labels, notes and description for format, accessibility and occasion, from 35mm and IMAX to relaxed, dog-friendly and live-scored screenings, so you can filter all of London for exactly the one you want.",
    href: "/formats",
    linkLabel: "See the formats",
  },
  {
    title: "Clubs & Festivals, Joined Up",
    description: `We follow ${FILM_CLUBS.length} film clubs and ${FESTIVALS.length} festivals, matching their screenings wherever they're held, so a programme spread across a dozen venues sits on one page. Filter the films or the planner down to any of them, or see what each has on next.`,
    href: "/film-clubs",
    linkLabel: "See the film clubs",
  },
];

export const moreReasons: Reason[] = [
  {
    title: "Ratings Side by Side",
    description:
      "IMDb, Letterboxd, Rotten Tomatoes, Metacritic and the Bechdel Test, with cast, synopsis and trailer from TMDB.",
    href: "/catalogue?base=default&dateRange=all",
  },
  {
    title: "Works With Letterboxd & IMDb",
    description:
      "Bring your watchlist and what you've seen, star your venues, and see what's on that you want to watch.",
    href: "/personalise",
  },
  {
    title: "Free, Independent & Open",
    description:
      "No one pays to be listed, and no chain or ticket seller owns us. You book direct with the venue. Open code, open data.",
    href: "/data-licence",
  },
];

// What a first-time reader can do here, each pointing at the page that does it.
export const features: Feature[] = [
  {
    title: "Browse Every Film",
    description:
      "Search and filter by date, venue, format, genre, rating or accessibility.",
    // The defaults on every date: the default week would hide most of it,
    // and `base` clears whatever filters the reader left the catalogue on.
    href: "/catalogue?base=default&dateRange=all",
  },
  {
    title: "Plan Your Week",
    description:
      "Lay screenings out by day and fit a few films around each other.",
    // The defaults, which are the next 7 days, rather than whatever filters
    // the reader left the planner on.
    href: "/planner?base=default",
  },
  {
    title: "What's On Near Me",
    description:
      "The cinemas closest to you, and what they're showing today and this week.",
    href: "/near-me",
  },
  {
    title: "Festivals & Film Clubs",
    description:
      "Follow a festival or a club's programme as it changes, all in one place.",
    href: "/festivals",
  },
  {
    title: "Film Lists",
    description:
      "Oscar winners, Palme d'Or films and all-time greats on a big screen now.",
    href: "/lists",
  },
  {
    title: "Your Watchlist",
    description:
      "Keep a watchlist and a seen list, import from Letterboxd and star your venues.",
    href: "/personalise",
  },
];

export const ratingSources = [
  { name: "IMDb", url: "https://www.imdb.com/" },
  { name: "Letterboxd", url: "https://letterboxd.com/" },
  { name: "Rotten Tomatoes", url: "https://www.rottentomatoes.com/" },
  { name: "Metacritic", url: "https://www.metacritic.com/" },
  { name: "Bechdel Test", url: "https://bechdeltest.com/" },
];

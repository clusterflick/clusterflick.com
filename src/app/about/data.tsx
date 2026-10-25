import {
  LetterboxdIcon,
  InstagramIcon,
  RedditIcon,
  ThreadsIcon,
  XIcon,
  BlueskyIcon,
} from "@/components/icons";

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
        bsky.app/profile/<strong>clusterflick</strong>.bsky.social
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

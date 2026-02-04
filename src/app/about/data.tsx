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

export const dataFormats = [
  {
    name: "Data file per venue",
    url: "https://github.com/clusterflick/data-transformed/releases/latest",
    description:
      "Individual JSON files for the showings at each venue. These all follow the same schema.",
  },
  {
    name: "Data combined by title",
    url: "https://github.com/clusterflick/data-combined/releases/latest",
    description:
      "This is a single JSON file containing all showings for all venues, grouped by film title.",
  },
  {
    name: "Calendar file per venue",
    url: "https://github.com/clusterflick/data-calendar/releases/latest",
    description:
      "Individual ICS files for the showings at each venue. Import cinema schedules into your calendar app.",
  },
];

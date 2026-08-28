import { FilterId } from "@/lib/filters/types";
import type { FilterState } from "@/lib/filters/types";

export type Festival = {
  id: string;
  name: string;
  url: string;
  aliases: string[];
  matchers: Partial<FilterState>[];
};

// https://kinoteka.org.uk/programme
const kinotekaTitles = [
  "THE SOLIDARITY TRILOGY: MAN OF MARBLE",
  "ROUGH TREATMENT",
  "THE PROMISED LAND",
  "THE CONDUCTOR",
  "THE SOLIDARITY TRILOGY: MAN OF IRON",
  "CHOPIN, A SONATA IN PARIS",
  "MAN OF HOPE",
  "KORCZAK",
  "IN MEMORIAM: MARCEL ŁOZIŃSKI",
  "FRANZ",
  "HOME SWEET HOME",
  "KATYN",
  "FRAMES OF FREEDOM",
  "MAN OF IRON",
  "POSSESSION",
  "THE DOG WHO TRAVELLED BY TRAIN 2",
  "The Travelling Dog 2",
  "DANTON",
  "A SHORT FILM ABOUT KILLING",
  "MR. OLBRYCHSKI",
  "THE GOOD BOY",
  "AFTERIMAGE",
  "KIEŚLOWSKI DOCU-SHORTS",
  "THE DOUBLE LIFE OF VERONIQUE",
  "THE POSSESSED",
  "THE PUBLIC WOMAN",
  "A GENERATION",
  "A SHORT FILM ABOUT LOVE",
  "TRAINS",
  "KANAL",
  "ASHES AND DIAMONDS",
  "LARP: LOVE, TROLLS AND OTHER QUESTS",
  "PILATE AND THE OTHERS",
  "Pilate and Others",
  "LETTERS FROM WOLF STREET",
  "LOVE IN GERMANY",
  "THE IN-LAWS 3",
  "BROTHER",
];

const kinotekaVenues = [
  "bfi.org.uk-southbank",
  "bfi.org.uk-imax",
  "institut-francais.org.uk",
  "ica.art",
  "curzon.com-bloomsbury",
  "barbican.org.uk",
  "bbk.ac.uk-cinema",
];

// Fringe! titles its screenings several ways — "… - FRINGE!" (Genesis),
// "FRINGE! PRESENTS …" (The Nickel), "Fringe! and Pink Palace: …" (Rio) and
// "Fringe x <collaborator> presents: …". Search normalisation strips
// punctuation, so the bang cannot anchor a matcher and a bare "Fringe" would
// also catch any film with the word in its title. The bare match is therefore
// scoped to the venues the festival currently uses, with the full name and the
// "presents" form left unscoped so a new venue is still picked up.
const fringeVenues = [
  "genesiscinema.co.uk",
  "riocinema.org.uk",
  "thenickel.co.uk",
  "thegardencinema.co.uk",
];

// The BFI runs LFF from the South Bank: the galas are at the Southbank
// Centre's Royal Festival Hall but ticketed by the BFI, so they arrive under
// BFI Southbank alongside the competition programme, the Screen Talks and the
// LFF for Free events. The rest of the 70th edition is split between BFI IMAX
// and four West End partner cinemas.
const londonFilmFestivalVenues = [
  "bfi.org.uk-southbank",
  "bfi.org.uk-imax",
  "curzon.com-soho",
  "ica.art",
  "princecharlescinema.com",
  "myvue.com-leicester-square",
];

export const FESTIVALS: Festival[] = [
  {
    id: "bfi-flare",
    name: "BFI Flare: London LGBTQIA+ Film Festival ",
    url: "https://whatson.bfi.org.uk/flare/Online/default.asp",
    aliases: ["flare"],
    matchers: [
      {
        [FilterId.PerformanceNotesSearch]: "Part of the BFI Flare festival",
      },
    ],
  },
  {
    id: "festival-of-creativity-gothic-film-festival",
    name: "Festival of Creativity: Gothic Film Festival",
    url: "https://www.stmarys.ac.uk/academic-areas/structure/fablet/school-of-theology-and-the-arts/festival-of-creativity",
    aliases: ["gothic-film-festival"],
    matchers: [
      {
        // Matches showings titled "Festival of Creativity: Gothic Film Festival"
        // at St Mary's University, The 1850 venue, running March 16–25 2026
        [FilterId.ShowingTitleSearch]: "Gothic Film Festival",
        [FilterId.Venues]: ["stmarys.ac.uk-the-1850"],
      },
    ],
  },
  {
    id: "london-soundtrack-festival",
    name: "London Soundtrack Festival",
    url: "https://londonsoundtrack.com/whats-on/",
    aliases: ["soundtrack-festival"],
    matchers: [
      {
        // Matches "London Soundtrack Festival: ..." and
        // "FFC x London Soundtrack Festival: ..." at the Barbican, April 9–11 2026
        [FilterId.ShowingTitleSearch]: "Soundtrack Festival",
        [FilterId.Venues]: ["barbican.org.uk"],
      },
    ],
  },
  {
    id: "judgement-hall-festival",
    name: "The Judgement Hall Festival",
    url: "https://www.thejudgementhall.com/programming",
    aliases: [],
    matchers: [
      {
        // Matches "The Judgement Hall Festival: ..." at Rio Cinema, April 12 2026
        [FilterId.ShowingTitleSearch]: "Judgement Hall Festival",
        [FilterId.Venues]: ["riocinema.org.uk"],
      },
    ],
  },
  {
    id: "london-fetish-film-festival",
    name: "London Fetish Film Festival",
    url: "https://filmfreeway.com/LondonFetishFilmFestival",
    aliases: ["lfff"],
    matchers: [
      {
        // Matches "LFFF: ..." showings at The Arzner
        [FilterId.ShowingTitleSearch]: "LFFF",
        [FilterId.Venues]: ["thearzner.com"],
      },
    ],
  },
  {
    id: "open-city-documentary-festival",
    name: "Open City Documentary Festival",
    url: "https://opencitylondon.com/",
    aliases: ["Open City Doc Fest", "Open City London"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "OCDF:",
      },
      {
        [FilterId.ShowingTitleSearch]: "OCDF x ",
      },
      {
        [FilterId.ShowingTitleSearch]: "Open City Documentary Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "Open City Doc Fest",
      },
    ],
  },
  {
    id: "kinoteka",
    name: "Kinoteka",
    url: "https://kinoteka.org.uk",
    aliases: ["Polish Film Festival"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Kinoteka",
        [FilterId.DateRange]: { start: 1770163200000, end: 1774742400000 },
        [FilterId.Venues]: kinotekaVenues,
      },
      {
        [FilterId.ShowingTitleSearch]: "PHOTOSENSITIVE",
        [FilterId.DateRange]: { start: 1770163200000, end: 1774742400000 },
        [FilterId.Venues]: ["thegardencinema.co.uk"],
      },
      {
        [FilterId.ShowingTitleSearch]: "ANNIVERSARY",
        [FilterId.DateRange]: { start: 1770163200000, end: 1774742400000 },
        [FilterId.Venues]: ["thegardencinema.co.uk"],
      },
      ...kinotekaTitles.map((title) => ({
        [FilterId.ShowingTitleSearch]: title,
        [FilterId.DateRange]: { start: 1770163200000, end: 1774742400000 },
        [FilterId.Venues]: kinotekaVenues,
      })),
    ],
  },
  {
    id: "docn-roll-film-festival",
    name: "Doc'n Roll Film Festival",
    url: "https://www.docnrollfestival.com/",
    aliases: ["Doc'n Roll"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Doc'n Roll",
      },
    ],
  },
  {
    id: "picture-east-film-festival",
    name: "PictureEast Film Festival",
    url: "https://www.tnbfc.co.uk/peff26",
    aliases: ["PEFF"],
    matchers: [
      { [FilterId.ShowingTitleSearch]: "PictureEast" },
      { [FilterId.ShowingTitleSearch]: "Picture East" },
    ],
  },
  {
    id: "women-without-borders-film-festival",
    name: "Women Without Borders Film Festival",
    url: "https://wwbfilm.com",
    aliases: ["WWBFF"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Women Without Borders",
      },
    ],
  },
  {
    id: "london-indian-film-festival",
    name: "London Indian Film Festival",
    url: "https://londonindianfilmfestival.co.uk/",
    aliases: ["liff"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "London Indian Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "London Indian Film Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "LIFF Opening",
      },
    ],
  },
  {
    id: "london-australian-film-festival",
    name: "London Australian Film Festival",
    url: "https://www.londonaustfilm.com/festival",
    aliases: ["laff"],
    matchers: [
      {
        // Matches "LAFF 2026: ..." showings (and the short film showcase
        // movie title) at Picturehouse Finsbury Park, running July 16–19 2026
        [FilterId.ShowingTitleSearch]: "LAFF 2026",
        [FilterId.Venues]: ["picturehouses.com-finsbury-park"],
      },
    ],
  },
  {
    id: "the-final-film-festival",
    name: "The Final Film Festival",
    url: "https://www.tfffestival.co.uk/",
    aliases: ["tfff"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Final Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "Final Film Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "TFFF:",
      },
      {
        [FilterId.ShowingTitleSearch]: "- TFFF",
      },
    ],
  },
  {
    id: "london-colombian-film-festival",
    name: "London Colombian Film Festival",
    url: "https://www.thelondoncolombianfilmfestival.com",
    aliases: ["lcff"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "LCFF",
      },
      {
        [FilterId.PerformanceNotesSearch]: "LCFF",
      },
      {
        [FilterId.PerformanceNotesSearch]: "London Colombian Film Festival",
      },
    ],
  },
  {
    id: "london-latino-film-festival",
    name: "London Latino Film Festival",
    url: "https://londonlatinofilmfestival.org.uk/",
    aliases: ["lolaff"],
    matchers: [
      {
        // Matches "London Latino Film Festival presents: ..." showings, which is
        // how the festival's screenings are titled across its venues (Barbican,
        // ICA, Ciné Lumière, BFI Stephen Street, The Garden Cinema), October 2–6 2026
        [FilterId.ShowingTitleSearch]: "London Latino Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "London Latino Film Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "LoLaFF",
      },
      {
        [FilterId.PerformanceNotesSearch]: "LoLaFF",
      },
    ],
  },
  {
    id: "the-shortest-nights-film-festival",
    name: "The Shortest Nights Film Festival",
    url: "https://www.shortsightedcinema.com/theshortestnightsfestival2026",
    aliases: ["the-shortest-nights", "shortest-nights"],
    matchers: [
      {
        // Matches "The Shortest Nights Film Festival: ..." programme blocks at
        // The Castle Sidcup, running September 5–6 2026
        [FilterId.ShowingTitleSearch]: "Shortest Nights",
        [FilterId.Venues]: ["castlesidcup.com"],
      },
    ],
  },
  // The Free Film Festivals network tags every performance it publishes with
  // "Part of the <neighbourhood> Free Film Festival", which is the only thing
  // distinguishing one festival from another — the screenings share a source,
  // and each one is at a different hall, pub or park rather than a fixed venue.
  {
    id: "peckham-nunhead-free-film-festival",
    name: "Peckham & Nunhead Free Film Festival",
    url: "https://freefilmfestivals.org/filmfestival/peckham-nunhead/",
    aliases: ["pnfff", "peckham-nunhead"],
    matchers: [
      {
        [FilterId.PerformanceNotesSearch]:
          "Peckham & Nunhead Free Film Festival",
      },
    ],
  },
  {
    id: "streatham-free-film-festival",
    name: "Streatham Free Film Festival",
    url: "https://freefilmfestivals.org/filmfestival/streatham/",
    aliases: ["streatham"],
    matchers: [
      {
        [FilterId.PerformanceNotesSearch]: "Streatham Free Film Festival",
      },
    ],
  },
  {
    id: "raynes-park-free-film-festival",
    name: "Raynes Park Free Film Festival",
    url: "https://freefilmfestivals.org/filmfestival/raynes-park/",
    aliases: ["raynes-park"],
    matchers: [
      {
        [FilterId.PerformanceNotesSearch]: "Raynes Park Free Film Festival",
      },
    ],
  },
  {
    id: "west-norwood-free-film-festival",
    name: "West Norwood Free Film Festival",
    url: "https://freefilmfestivals.org/filmfestival/west-norwood/",
    aliases: ["wnfff", "west-norwood"],
    matchers: [
      {
        [FilterId.PerformanceNotesSearch]: "West Norwood Free Film Festival",
      },
    ],
  },
  {
    id: "animation-in-love",
    name: "Animation in Love",
    url: "https://www.barbican.org.uk/whats-on/2026/series/animation-in-love",
    aliases: [],
    matchers: [
      {
        // Matches "Animation In Love: ..." / "Animation in Love: ..."
        // at the Barbican, running June–October 2026
        [FilterId.ShowingTitleSearch]: "Animation in Love",
        [FilterId.Venues]: ["barbican.org.uk"],
      },
    ],
  },
  {
    id: "hong-kong-film-festival-uk",
    name: "Hong Kong Film Festival UK",
    url: "https://www.hkff.uk",
    aliases: ["hkff", "hong-kong-film-festival"],
    matchers: [
      {
        // Venues title these "Hong Kong Film Festival UK: ..." (Rio) or
        // "Hong Kong Film Festival 2026-27 - ..." (Theatreship). The fourth
        // edition runs 25 September – 4 October 2026 across 11 London venues.
        [FilterId.ShowingTitleSearch]: "Hong Kong Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "Hong Kong Film Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "HKFF",
      },
      {
        [FilterId.PerformanceNotesSearch]: "HKFF",
      },
    ],
  },
  {
    id: "kino-london-short-film-festival",
    name: "Kino London Short Film Festival",
    url: "https://www.kinoshortfilm.com",
    aliases: ["klsff", "kino-london"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Kino London Short Film Festival",
      },
      {
        // Catches the industry sessions and open-screen nights, which are
        // titled "Kino Industry Session: …" and "Short Film Open Screen".
        [FilterId.PerformanceNotesSearch]: "Kino Short Film",
      },
    ],
  },
  {
    id: "ukrainian-film-festival",
    name: "Ukrainian Film Festival",
    url: "https://uil.org.uk/ukrainian-film-festival/",
    aliases: ["ukrainian-film-fest"],
    matchers: [
      // Curzon titles these "Ukrainian Film Fest: …"; the festival's own name
      // is "Ukrainian Film Festival", and the shorter string matches both.
      { [FilterId.ShowingTitleSearch]: "Ukrainian Film Fest" },
      { [FilterId.PerformanceNotesSearch]: "Ukrainian Film Fest" },
    ],
  },
  {
    id: "wine-dark-short-film-festival",
    name: "Wine Dark Short Film Festival",
    url: "https://www.winedark.co.uk/wine-dark-short-film-festival",
    aliases: ["wdsff", "wine-dark"],
    matchers: [
      // Picturehouse titles each strand "<Strand> - Wine Dark Short Film
      // Festival".
      { [FilterId.ShowingTitleSearch]: "Wine Dark Short Film Festival" },
      { [FilterId.PerformanceNotesSearch]: "Wine Dark Short Film Festival" },
    ],
  },
  {
    id: "fringe-queer-film-arts-fest",
    name: "Fringe! Queer Film & Arts Fest",
    url: "https://www.fringefilmfest.com",
    aliases: ["fringe", "fringe-queer-film-festival"],
    matchers: [
      {
        [FilterId.ShowingTitleSearch]: "Fringe",
        [FilterId.Venues]: fringeVenues,
      },
      { [FilterId.ShowingTitleSearch]: "Fringe Queer Film Festival" },
      { [FilterId.ShowingTitleSearch]: "Fringe Presents" },
    ],
  },
  {
    id: "fighting-spirit-film-festival",
    name: "The Fighting Spirit Film Festival",
    url: "https://www.fightingspiritfilmfestival.com",
    aliases: ["fsff", "fighting-spirit"],
    matchers: [
      {
        // The Rio titles each screening "Fighting Spirit: …". Scoped to the
        // venue because "Fighting Spirit" is also a film title in its own
        // right; the full festival name is matched unscoped below.
        [FilterId.ShowingTitleSearch]: "Fighting Spirit",
        [FilterId.Venues]: ["riocinema.org.uk"],
      },
      { [FilterId.ShowingTitleSearch]: "Fighting Spirit Film Festival" },
    ],
  },
  {
    id: "south-london-film-festival",
    name: "The South London Film Festival",
    url: "https://www.southlondonfilmfest.co.uk/",
    aliases: ["slff", "south-london-film-fest"],
    matchers: [
      {
        // The Ritzy titles these "The South London Film Festival Presents: …"
        // and "The South London Film Festival Official Awards Showcase 2026";
        // the 2026 edition runs 12–27 September, all at the Ritzy.
        [FilterId.ShowingTitleSearch]: "South London Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "South London Film Festival",
      },
    ],
  },
  {
    id: "tibet-film-festival",
    name: "Tibet Film Festival London",
    url: "https://www.tibetfilmfestival.org/london",
    aliases: ["tff-london", "tibet-film-festival-london"],
    matchers: [
      {
        // Venues title these "Tibet Film Festival: ..." / "Tibet Film Festival
        // London presents: ..."; the 2026 London edition runs 25-27 September
        // across east and central London (past editions: Genesis, Rio, The
        // Garden Cinema, Regent Street Cinema). Left unscoped because the
        // festival moves venues each year and the full name is distinctive
        // enough on its own - a bare "Tibet" would catch films with the word in
        // their title.
        [FilterId.ShowingTitleSearch]: "Tibet Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "Tibet Film Festival",
      },
      {
        [FilterId.ShowingTitleSearch]: "TFF London",
      },
      {
        [FilterId.PerformanceNotesSearch]: "TFF London",
      },
    ],
  },
  {
    id: "frightfest",
    name: "FrightFest",
    url: "https://www.frightfest.co.uk",
    aliases: ["fright-fest", "tubi-frightfest"],
    matchers: [
      {
        // The ODEON Luxe Leicester Square and West End screens tag every
        // performance "Part of FrightFest <year>". Search normalisation strips
        // spaces, so this single string also covers venues that write it
        // "Fright Fest".
        [FilterId.PerformanceNotesSearch]: "FrightFest",
      },
      {
        // Some venues instead title the screening "FrightFest presents: ..." /
        // "FrightFest Halloween All-Dayer: ...". Left unscoped because the
        // festival moves house (Prince Charles, Empire, Cineworld, now the two
        // ODEON Luxes) and the name is distinctive enough on its own.
        [FilterId.ShowingTitleSearch]: "FrightFest",
      },
    ],
  },
  {
    id: "bfi-london-film-festival",
    name: "BFI London Film Festival",
    url: "https://www.bfi.org.uk/london-film-festival",
    aliases: ["lff", "london-film-festival"],
    matchers: [
      {
        // The full name is the only form safe to match unscoped: search
        // normalisation strips spacing, so a bare "London Film Festival" is a
        // substring of "The South London Film Festival" and would swallow the
        // Ritzy's programme whole. Keeping the BFI prefix also picks up the
        // year-round member events ("BFI London Film Festival Member Quiz").
        [FilterId.ShowingTitleSearch]: "BFI London Film Festival",
      },
      {
        [FilterId.PerformanceNotesSearch]: "BFI London Film Festival",
      },
      {
        // Partner cinemas drop the BFI prefix and shorten the name, titling
        // screenings "London Film Festival: ..." or "LFF: ...". Both short
        // forms are scoped to the festival's venues — "lff" survives
        // normalisation as a bare three-letter run that could fall inside an
        // ordinary title.
        [FilterId.ShowingTitleSearch]: "London Film Festival",
        [FilterId.Venues]: londonFilmFestivalVenues,
      },
      {
        [FilterId.PerformanceNotesSearch]: "London Film Festival",
        [FilterId.Venues]: londonFilmFestivalVenues,
      },
      {
        [FilterId.ShowingTitleSearch]: "LFF",
        [FilterId.Venues]: londonFilmFestivalVenues,
      },
      {
        [FilterId.PerformanceNotesSearch]: "LFF",
        [FilterId.Venues]: londonFilmFestivalVenues,
      },
    ],
  },
];

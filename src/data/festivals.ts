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
        [FilterId.ShowingTitleSearch]: "Open City Doc Fest",
      },
      {
        [FilterId.ShowingTitleSearch]: "Open City Documentary Festival",
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
];

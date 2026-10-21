/**
 * The numbers behind /reports/london-cinemas-2026: a snapshot, not a live
 * count. Produced by export_london.py (see the report's working).
 *
 * Every screening listed from 2026-01-01 to 2026-10-19 was rebuilt from the
 * daily data-combined releases, each release supplying the screenings up to the
 * next one, so nothing is counted twice. Only film screenings count: films,
 * shorts, double bills and TV. A venue that changed id is counted once.
 *
 * Year-long venue rankings use venues followed since January or February;
 * share rankings also need 200+ screenings. The format and language rankings
 * cover their own windows instead, with 100+ screenings for languages. Format data starts 2026-07-01 and language data
 * 2026-08-21, so those sections cover only those windows. A film's
 * year is its release year, so a re-release counts as the original.
 */
export const LONDON_CINEMAS_2026 = {
  from: "2026-01-01",
  to: "2026-10-19",
  londonScreenings: 826804,
  venuesWithScreenings: 418,
  mostScreenedFilms: [
    {
      title: "Spider-Man: Brand New Day",
      screenings: 34025,
    },
    {
      title: "Toy Story 5",
      screenings: 31402,
    },
    {
      title: "The Odyssey",
      screenings: 29680,
    },
  ],
  mostScreeningsOfOneFilm: {
    id: "myvue.com-westfield",
    name: "Vue Westfield London",
    current: true,
    title: "Spider-Man: Brand New Day",
    screenings: 1337,
  },
  repertory: [
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      current: true,
      value: 85.8,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      current: true,
      value: 69.4,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      current: true,
      value: 68.6,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      current: true,
      value: 42.7,
    },
    {
      id: "thegardencinema.co.uk",
      name: "The Garden Cinema",
      current: true,
      value: 21.8,
    },
    {
      id: "ica.art",
      name: "Institute of Contemporary Arts",
      current: true,
      value: 17.6,
    },
  ],
  nickel: {
    onceShare: 76,
    films: 428,
    medianYear: 1982,
  },
  mostDifferentFilms: [
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      current: true,
      value: 807,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      current: true,
      value: 758,
    },
    {
      id: "cineworld.co.uk-the-o2-greenwich",
      name: "Cineworld The O2 Greenwich",
      current: true,
      value: 547,
    },
  ],
  mostDecades: {
    id: "bfi.org.uk-southbank",
    name: "BFI Southbank",
    current: true,
    value: 12,
  },
  formatFrom: "2026-07-01",
  formats: {
    "35mm": 641,
    "70mm": 347,
    "imax-70mm": 322,
    "16mm": 24,
    vhs: 8,
  },
  printScreenings: 1334,
  odysseyPrintScreenings: 885,
  printVenues: [
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      current: true,
      value: 223,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      current: true,
      value: 59,
    },
    {
      id: "odeon.co.uk-leicester-square",
      name: "ODEON Luxe Leicester Square",
      current: true,
      value: 55,
    },
    {
      id: "picturehouses.com-central",
      name: "Picturehouse Central",
      current: true,
      value: 32,
    },
    {
      id: "curzon.com-soho",
      name: "Curzon Soho",
      current: true,
      value: 22,
    },
    {
      id: "everymancinema.com-screen-on-the-green",
      name: "Everyman Screen on the Green",
      current: true,
      value: 18,
    },
  ],
  oldestFilms: [
    {
      title: "Dante's Inferno",
      year: 1911,
      id: "theatreship.co.uk",
      name: "Theatreship",
      current: true,
    },
    {
      title: "Quo Vadis?",
      year: 1913,
      id: "cinemamuseum.org.uk",
      name: "The Cinema Museum",
      current: true,
    },
    {
      title: "Filibus",
      year: 1915,
      id: "finchcafe.co.uk",
      name: "Finch Community Cinema",
      current: true,
    },
    {
      title: "The German Retreat and the Battle of Arras",
      year: 1917,
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      current: true,
    },
    {
      title: "One Week",
      year: 1920,
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      current: true,
    },
  ],
  languageFrom: "2026-08-21",
  languageScreenings: 167962,
  nonEnglishShare: 11.6,
  languages: 79,
  nonEnglish: [
    {
      id: "institut-francais.org.uk",
      name: "Ciné Lumière",
      current: true,
      value: 88.3,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      current: true,
      value: 75.3,
    },
    {
      id: "cineworld.co.uk-ilford",
      name: "Cineworld Ilford",
      current: true,
      value: 72.3,
    },
    {
      id: "metrocinema.co.uk",
      name: "Metro Cinema",
      current: true,
      value: 68.9,
    },
    {
      id: "cineworld.co.uk-hounslow",
      name: "Cineworld Hounslow",
      current: true,
      value: 57.5,
    },
    {
      id: "cineworld.co.uk-south-ruislip",
      name: "Cineworld South Ruislip",
      current: true,
      value: 48.0,
    },
  ],
  mostLanguages: [
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      current: true,
      value: 35,
    },
    {
      id: "curzon.com-soho",
      name: "Curzon Soho",
      current: true,
      value: 25,
    },
  ],
  mostNonEnglishScreenings: {
    id: "cineworld.co.uk-ilford",
    name: "Cineworld Ilford",
    current: true,
    value: 1722,
  },
  relaxed: {
    screenings: 1108,
    venues: 83,
    leaders: [
      {
        id: "lumiereromford.com",
        name: "Lumiere Cinema Romford",
        current: true,
        value: 137,
      },
      {
        id: "bfi.org.uk-southbank",
        name: "BFI Southbank",
        current: true,
        value: 44,
      },
      {
        id: "curzon.com-camden",
        name: "Curzon Camden",
        current: true,
        value: 41,
      },
      {
        id: "curzon.com-kingston",
        name: "Curzon Kingston",
        current: true,
        value: 41,
      },
      {
        id: "curzon.com-aldgate",
        name: "Curzon Aldgate",
        current: true,
        value: 40,
      },
      {
        id: "omniplex.co.uk-sutton",
        name: "Omniplex Sutton",
        current: true,
        value: 40,
      },
    ],
  },
  hardOfHearing: {
    screenings: 14305,
    venues: 103,
    leaders: [
      {
        id: "bfi.org.uk-southbank",
        name: "BFI Southbank",
        current: true,
        value: 855,
      },
      {
        id: "picturehouses.com-greenwich",
        name: "Greenwich Picturehouse",
        current: true,
        value: 825,
      },
      {
        id: "picturehouses.com-finsbury-park",
        name: "Finsbury Park Picturehouse",
        current: true,
        value: 505,
      },
    ],
  },
  venueTypes: {
    Cinema: 129,
    "Pub & Bar": 41,
    "Community Centre": 24,
    "University & College": 23,
    "Cultural Centre": 21,
    "Arts Centre": 20,
    "Library & Archive": 20,
    "Creative Space": 20,
    "Community Cinema": 15,
    "Park & Outdoor Space": 15,
    "Place of Worship": 14,
    "Music Venue": 13,
    "Café & Restaurant": 11,
    Hotel: 10,
    Theatre: 9,
    Museum: 8,
    Other: 8,
    Shop: 7,
    "Screening Room": 6,
    Gallery: 5,
    "Food Hall & Market": 4,
  },
} as const;

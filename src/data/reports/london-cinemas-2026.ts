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
 * cover their own windows instead, with 100+ screenings for languages. Format
 * data starts 2026-07-01 and language data 2026-08-21. A film's
 * year is its release year, so a re-release counts as the original. Languages
 * are TheMovieDB's codes. Format counts drop a screening listed twice by two
 * sources on the same format (4 of them).
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
    type: "Cinema",
    current: true,
    title: "Spider-Man: Brand New Day",
    screenings: 1337,
  },
  repertory: [
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 85.8,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 69.4,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      type: "Cinema",
      current: true,
      value: 68.6,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 42.7,
    },
    {
      id: "thegardencinema.co.uk",
      name: "The Garden Cinema",
      type: "Cinema",
      current: true,
      value: 21.8,
    },
    {
      id: "ica.art",
      name: "Institute of Contemporary Arts",
      type: "Cinema",
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
      type: "Cinema",
      current: true,
      value: 807,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 758,
    },
    {
      id: "cineworld.co.uk-the-o2-greenwich",
      name: "Cineworld The O2 Greenwich",
      type: "Cinema",
      current: true,
      value: 547,
    },
  ],
  mostDecades: {
    id: "bfi.org.uk-southbank",
    name: "BFI Southbank",
    type: "Cinema",
    current: true,
    value: 12,
  },
  formatDuplicatesDropped: 4,
  formatFrom: "2026-07-01",
  formats: [
    {
      format: "35mm",
      total: 641,
      odyssey: 246,
    },
    {
      format: "70mm",
      total: 347,
      odyssey: 317,
    },
    {
      format: "imax-70mm",
      total: 322,
      odyssey: 322,
    },
    {
      format: "16mm",
      total: 20,
      odyssey: 0,
    },
    {
      format: "vhs",
      total: 8,
      odyssey: 0,
    },
  ],
  printScreenings: 1330,
  odysseyPrintScreenings: 885,
  printVenues: [
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 223,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 59,
    },
    {
      id: "odeon.co.uk-leicester-square",
      name: "ODEON Luxe Leicester Square",
      type: "Cinema",
      current: true,
      value: 55,
    },
    {
      id: "picturehouses.com-central",
      name: "Picturehouse Central",
      type: "Cinema",
      current: true,
      value: 32,
    },
    {
      id: "curzon.com-soho",
      name: "Curzon Soho",
      type: "Cinema",
      current: true,
      value: 22,
    },
    {
      id: "everymancinema.com-screen-on-the-green",
      name: "Everyman Screen on the Green",
      type: "Cinema",
      current: true,
      value: 18,
    },
  ],
  sixteenMillimetre: [
    {
      id: "thecastlecinema.com",
      name: "The Castle Cinema",
      type: "Cinema",
      current: true,
      value: 9,
    },
    {
      id: "cinemamuseum.org.uk",
      name: "The Cinema Museum",
      type: "Cinema",
      current: true,
      value: 4,
    },
    {
      id: "ica.art",
      name: "Institute of Contemporary Arts",
      type: "Cinema",
      current: true,
      value: 4,
    },
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 2,
    },
    {
      id: "mildmay.club",
      name: "The Mildmay Club",
      type: "Music Venue",
      current: true,
      value: 1,
    },
  ],
  vhs: [
    {
      id: "dalstonsuperstore.com",
      name: "Dalston Superstore",
      type: "Pub & Bar",
      current: true,
      value: 3,
      borough: "Hackney",
    },
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 3,
      borough: "Camden",
    },
    {
      id: "facebook.com-thehaggerston",
      name: "The Haggerston",
      type: "Pub & Bar",
      current: true,
      value: 2,
      borough: "Hackney",
    },
  ],
  oldestFilms: [
    {
      title: "Dante's Inferno",
      year: 1911,
      id: "theatreship.co.uk",
      name: "Theatreship",
      type: "Community Cinema",
      current: true,
    },
    {
      title: "Quo Vadis?",
      year: 1913,
      id: "cinemamuseum.org.uk",
      name: "The Cinema Museum",
      type: "Cinema",
      current: true,
    },
    {
      title: "Filibus",
      year: 1915,
      id: "finchcafe.co.uk",
      name: "Finch Community Cinema",
      type: "Community Cinema",
      current: true,
    },
    {
      title: "The German Retreat and the Battle of Arras",
      year: 1917,
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
    },
    {
      title: "One Week",
      year: 1920,
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
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
      type: "Cultural Centre",
      current: true,
      value: 88.3,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      type: "Cinema",
      current: true,
      value: 75.3,
    },
    {
      id: "cineworld.co.uk-ilford",
      name: "Cineworld Ilford",
      type: "Cinema",
      current: true,
      value: 72.3,
    },
    {
      id: "metrocinema.co.uk",
      name: "Metro Cinema",
      type: "Cinema",
      current: true,
      value: 68.9,
    },
    {
      id: "cineworld.co.uk-hounslow",
      name: "Cineworld Hounslow",
      type: "Cinema",
      current: true,
      value: 57.5,
    },
    {
      id: "cineworld.co.uk-south-ruislip",
      name: "Cineworld South Ruislip",
      type: "Cinema",
      current: true,
      value: 48.0,
    },
  ],
  languageMix: {
    "institut-francais.org.uk": [
      {
        language: "fr",
        screenings: 240,
      },
      {
        language: "es",
        screenings: 40,
      },
      {
        language: "ka",
        screenings: 11,
      },
      {
        language: "ar",
        screenings: 7,
      },
    ],
    "closeupfilmcentre.com": [
      {
        language: "fr",
        screenings: 19,
      },
      {
        language: "ja",
        screenings: 16,
      },
      {
        language: "es",
        screenings: 8,
      },
      {
        language: "it",
        screenings: 6,
      },
    ],
    "cineworld.co.uk-ilford": [
      {
        language: "ta",
        screenings: 482,
      },
      {
        language: "hi",
        screenings: 392,
      },
      {
        language: "ml",
        screenings: 329,
      },
      {
        language: "te",
        screenings: 301,
      },
    ],
    "metrocinema.co.uk": [
      {
        language: "hi",
        screenings: 223,
      },
      {
        language: "ml",
        screenings: 45,
      },
      {
        language: "ta",
        screenings: 23,
      },
      {
        language: "ar",
        screenings: 16,
      },
    ],
    "cineworld.co.uk-hounslow": [
      {
        language: "hi",
        screenings: 397,
      },
      {
        language: "ta",
        screenings: 313,
      },
      {
        language: "te",
        screenings: 247,
      },
      {
        language: "pa",
        screenings: 154,
      },
    ],
    "cineworld.co.uk-south-ruislip": [
      {
        language: "hi",
        screenings: 462,
      },
      {
        language: "ta",
        screenings: 385,
      },
      {
        language: "ml",
        screenings: 130,
      },
      {
        language: "pa",
        screenings: 100,
      },
    ],
  },
  mostLanguages: [
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 35,
    },
    {
      id: "curzon.com-soho",
      name: "Curzon Soho",
      type: "Cinema",
      current: true,
      value: 25,
    },
  ],
  mostNonEnglishScreenings: {
    id: "cineworld.co.uk-ilford",
    name: "Cineworld Ilford",
    type: "Cinema",
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
        type: "Cinema",
        current: true,
        value: 137,
      },
      {
        id: "bfi.org.uk-southbank",
        name: "BFI Southbank",
        type: "Cinema",
        current: true,
        value: 44,
      },
      {
        id: "curzon.com-camden",
        name: "Curzon Camden",
        type: "Cinema",
        current: true,
        value: 41,
      },
      {
        id: "curzon.com-kingston",
        name: "Curzon Kingston",
        type: "Cinema",
        current: true,
        value: 41,
      },
      {
        id: "curzon.com-aldgate",
        name: "Curzon Aldgate",
        type: "Cinema",
        current: true,
        value: 40,
      },
      {
        id: "omniplex.co.uk-sutton",
        name: "Omniplex Sutton",
        type: "Cinema",
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
        type: "Cinema",
        current: true,
        value: 855,
      },
      {
        id: "picturehouses.com-greenwich",
        name: "Greenwich Picturehouse",
        type: "Cinema",
        current: true,
        value: 825,
      },
      {
        id: "picturehouses.com-finsbury-park",
        name: "Finsbury Park Picturehouse",
        type: "Cinema",
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

/**
 * The numbers behind /reports/london-cinemas-2026: a snapshot, not a live
 * count. Produced by export_london.py (see the report's working).
 *
 * Every screening listed from 2026-01-01 to 2026-10-31 was rebuilt from the
 * daily data-combined releases, each release supplying the screenings up to the
 * next one, so nothing is counted twice. Only film screenings count: films,
 * shorts, double bills and TV. A venue that changed id is counted once.
 *
 * Year-long venue rankings use venues followed since January or February;
 * share rankings also need 200+ screenings. Format data starts
 * 2026-07-01, so the format rankings cover that window, and drop a
 * screening listed twice by two sources on the same format
 * (4 of them). The pipeline recorded original
 * language from 2026-08-21; earlier screenings take it from TheMovieDB
 * details cached in data-cache releases while the film was showing
 * (tmdb_languages.py), covering 99.97% of matched screenings.
 * "xx", TheMovieDB's no language, counts as neither. A film's year is its
 * release year, so a re-release counts as the original.
 */
export const LONDON_CINEMAS_2026 = {
  from: "2026-01-01",
  to: "2026-10-31",
  londonScreenings: 863909,
  venuesWithScreenings: 444,
  mostScreenedFilms: [
    {
      title: "Spider-Man: Brand New Day",
      screenings: 34257,
    },
    {
      title: "Toy Story 5",
      screenings: 31402,
    },
    {
      title: "The Odyssey",
      screenings: 29851,
    },
  ],
  mostScreeningsOfOneFilm: {
    id: "myvue.com-westfield",
    name: "Vue Westfield London",
    type: "Cinema",
    current: true,
    title: "Spider-Man: Brand New Day",
    screenings: 1365,
  },
  repertory: [
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 86,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 70,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      type: "Cinema",
      current: true,
      value: 68.9,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 42.9,
    },
    {
      id: "thegardencinema.co.uk",
      name: "The Garden Cinema",
      type: "Cinema",
      current: true,
      value: 21.7,
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
    onceShare: 74,
    films: 438,
    medianYear: 1982,
  },
  mostDifferentFilms: [
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 856,
    },
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 775,
    },
    {
      id: "cineworld.co.uk-the-o2-greenwich",
      name: "Cineworld The O2 Greenwich",
      type: "Cinema",
      current: true,
      value: 577,
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
      total: 744,
      odyssey: 247,
    },
    {
      format: "70mm",
      total: 357,
      odyssey: 327,
    },
    {
      format: "imax-70mm",
      total: 343,
      odyssey: 341,
    },
    {
      format: "16mm",
      total: 26,
      odyssey: 0,
    },
    {
      format: "vhs",
      total: 11,
      odyssey: 0,
    },
  ],
  printScreenings: 1470,
  odysseyPrintScreenings: 915,
  printVenues: [
    {
      id: "princecharlescinema.com",
      name: "Prince Charles Cinema",
      type: "Cinema",
      current: true,
      value: 254,
    },
    {
      id: "odeon.co.uk-leicester-square",
      name: "ODEON Luxe Leicester Square",
      type: "Cinema",
      current: true,
      value: 76,
    },
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 71,
    },
    {
      id: "picturehouses.com-central",
      name: "Picturehouse Central",
      type: "Cinema",
      current: true,
      value: 59,
    },
    {
      id: "everymancinema.com-screen-on-the-green",
      name: "Everyman Screen on the Green",
      type: "Cinema",
      current: true,
      value: 26,
    },
    {
      id: "curzon.com-soho",
      name: "Curzon Soho",
      type: "Cinema",
      current: true,
      value: 22,
    },
  ],
  sixteenMillimetre: [
    {
      id: "thecastlecinema.com",
      name: "The Castle Cinema",
      type: "Cinema",
      current: true,
      value: 12,
    },
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 5,
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
      value: 4,
      borough: "Hackney",
    },
    {
      id: "thenickel.co.uk",
      name: "The Nickel",
      type: "Cinema",
      current: true,
      value: 4,
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
    {
      id: "worldwidecoven.net",
      name: "Coven",
      type: "Pub & Bar",
      current: true,
      value: 1,
      borough: "Westminster",
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
  languageScreenings: 855992,
  languageCoverage: 99.97,
  nonEnglishShare: 12.1,
  languages: 93,
  nonEnglish: [
    {
      id: "institut-francais.org.uk",
      name: "Ciné Lumière",
      type: "Cultural Centre",
      current: true,
      value: 82.6,
    },
    {
      id: "closeupfilmcentre.com",
      name: "Close-Up Film Centre",
      type: "Cinema",
      current: true,
      value: 78.9,
    },
    {
      id: "metrocinema.co.uk",
      name: "Metro Cinema",
      type: "Cinema",
      current: true,
      value: 75.1,
    },
    {
      id: "cineworld.co.uk-ilford",
      name: "Cineworld Ilford",
      type: "Cinema",
      current: true,
      value: 63.5,
    },
    {
      id: "ica.art",
      name: "Institute of Contemporary Arts",
      type: "Cinema",
      current: true,
      value: 58.2,
    },
    {
      id: "cineworld.co.uk-hounslow",
      name: "Cineworld Hounslow",
      type: "Cinema",
      current: true,
      value: 51.7,
    },
  ],
  languageMix: {
    "institut-francais.org.uk": [
      {
        language: "fr",
        screenings: 793,
      },
      {
        language: "it",
        screenings: 93,
      },
      {
        language: "es",
        screenings: 87,
      },
      {
        language: "ar",
        screenings: 80,
      },
    ],
    "closeupfilmcentre.com": [
      {
        language: "fa",
        screenings: 63,
      },
      {
        language: "fr",
        screenings: 63,
      },
      {
        language: "ja",
        screenings: 30,
      },
      {
        language: "it",
        screenings: 27,
      },
    ],
    "metrocinema.co.uk": [
      {
        language: "hi",
        screenings: 998,
      },
      {
        language: "ml",
        screenings: 230,
      },
      {
        language: "gu",
        screenings: 143,
      },
      {
        language: "te",
        screenings: 73,
      },
    ],
    "cineworld.co.uk-ilford": [
      {
        language: "hi",
        screenings: 1973,
      },
      {
        language: "ta",
        screenings: 1614,
      },
      {
        language: "ml",
        screenings: 1585,
      },
      {
        language: "te",
        screenings: 1578,
      },
    ],
    "ica.art": [
      {
        language: "fr",
        screenings: 210,
      },
      {
        language: "es",
        screenings: 132,
      },
      {
        language: "ja",
        screenings: 127,
      },
      {
        language: "pt",
        screenings: 92,
      },
    ],
    "cineworld.co.uk-hounslow": [
      {
        language: "hi",
        screenings: 2062,
      },
      {
        language: "te",
        screenings: 1347,
      },
      {
        language: "pa",
        screenings: 1073,
      },
      {
        language: "ta",
        screenings: 1019,
      },
    ],
  },
  mostLanguages: [
    {
      id: "bfi.org.uk-southbank",
      name: "BFI Southbank",
      type: "Cinema",
      current: true,
      value: 47,
    },
    {
      id: "barbican.org.uk",
      name: "The Barbican",
      type: "Cinema",
      current: true,
      value: 42,
    },
  ],
  mostNonEnglishScreenings: {
    id: "cineworld.co.uk-ilford",
    name: "Cineworld Ilford",
    type: "Cinema",
    current: true,
    value: 7945,
  },
  relaxed: {
    screenings: 1160,
    venues: 84,
    leaders: [
      {
        id: "lumiereromford.com",
        name: "Lumiere Cinema Romford",
        type: "Cinema",
        current: true,
        value: 142,
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
        value: 42,
      },
      {
        id: "curzon.com-kingston",
        name: "Curzon Kingston",
        type: "Cinema",
        current: true,
        value: 42,
      },
      {
        id: "curzon.com-aldgate",
        name: "Curzon Aldgate",
        type: "Cinema",
        current: true,
        value: 41,
      },
      {
        id: "curzon.com-hoxton",
        name: "Curzon Hoxton",
        type: "Cinema",
        current: true,
        value: 41,
      },
    ],
  },
  hardOfHearing: {
    screenings: 14959,
    venues: 103,
    leaders: [
      {
        id: "bfi.org.uk-southbank",
        name: "BFI Southbank",
        type: "Cinema",
        current: true,
        value: 893,
      },
      {
        id: "picturehouses.com-greenwich",
        name: "Greenwich Picturehouse",
        type: "Cinema",
        current: true,
        value: 853,
      },
      {
        id: "picturehouses.com-finsbury-park",
        name: "Finsbury Park Picturehouse",
        type: "Cinema",
        current: true,
        value: 511,
      },
    ],
  },
  venueTypes: {
    Cinema: 129,
    "Pub & Bar": 47,
    "Community Centre": 26,
    "Creative Space": 24,
    "University & College": 23,
    "Cultural Centre": 22,
    "Library & Archive": 22,
    "Arts Centre": 21,
    "Place of Worship": 18,
    "Park & Outdoor Space": 16,
    "Community Cinema": 15,
    "Music Venue": 15,
    "Café & Restaurant": 12,
    Hotel: 10,
    Museum: 10,
    Theatre: 9,
    Other: 8,
    Shop: 7,
    "Screening Room": 6,
    Gallery: 5,
    "Food Hall & Market": 4,
  },
} as const;

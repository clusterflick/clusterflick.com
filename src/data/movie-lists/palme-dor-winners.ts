import type { MovieListEntry } from "./types";

/**
 * Every winner of the Palme d'Or, most recent first.
 *
 * Source: https://en.wikipedia.org/wiki/Palme_d%27Or
 *
 * Scoped to 1955 onwards, when the Palme d'Or proper replaced the Grand Prix du
 * Festival, and excluding honorary and special Palmes (so 2018 is
 * `Shoplifters`, not Godard's Special Palme). Shared years keep both winners —
 * nine years have two. 1968 and 2020 are absent because those festivals were
 * abandoned and no award was made.
 *
 * Deliberately unranked: this is a roll of winners, not a countdown, so the
 * list page shows no position badges.
 *
 * `year` is the festival year rather than the film's release year — the two
 * differ by one for films that premiered the previous year, which the matcher's
 * year tolerance absorbs.
 */
export const PALME_DOR_WINNERS: MovieListEntry[] = [
  { title: "Fjord", year: 2026, tmdbId: "1401459" },
  { title: "It Was Just an Accident", year: 2025, tmdbId: "1456349" },
  { title: "Anora", year: 2024, tmdbId: "1064213" },
  { title: "Anatomy of a Fall", year: 2023, tmdbId: "915935" },
  { title: "Triangle of Sadness", year: 2022, tmdbId: "497828" },
  { title: "Titane", year: 2021, tmdbId: "630240" },
  { title: "Parasite", year: 2019, tmdbId: "496243" },
  { title: "Shoplifters", year: 2018, tmdbId: "505192" },
  { title: "The Square", year: 2017, tmdbId: "401246" },
  { title: "I, Daniel Blake", year: 2016, tmdbId: "374473" },
  { title: "Dheepan", year: 2015, tmdbId: "314402" },
  { title: "Winter Sleep", year: 2014, tmdbId: "265169" },
  { title: "Blue Is the Warmest Colour", year: 2013, tmdbId: "152584" },
  { title: "Amour", year: 2012, tmdbId: "86837" },
  { title: "The Tree of Life", year: 2011, tmdbId: "8967" },
  {
    title: "Uncle Boonmee Who Can Recall His Past Lives",
    year: 2010,
    tmdbId: "38368",
  },
  { title: "The White Ribbon", year: 2009, tmdbId: "37903" },
  { title: "The Class", year: 2008, tmdbId: "8841" },
  { title: "4 Months, 3 Weeks and 2 Days", year: 2007, tmdbId: "2009" },
  { title: "The Wind That Shakes the Barley", year: 2006, tmdbId: "1116" },
  { title: "L'Enfant", year: 2005, tmdbId: "11490" },
  { title: "Fahrenheit 9/11", year: 2004, tmdbId: "1777" },
  { title: "Elephant", year: 2003, tmdbId: "1807" },
  { title: "The Pianist", year: 2002, tmdbId: "423" },
  { title: "The Son's Room", year: 2001, tmdbId: "11447" },
  { title: "Dancer in the Dark", year: 2000, tmdbId: "16" },
  { title: "Rosetta", year: 1999, tmdbId: "11489" },
  { title: "Eternity and a Day", year: 1998, tmdbId: "24858" },
  { title: "Taste of Cherry", year: 1997, tmdbId: "30020" },
  { title: "The Eel", year: 1997, tmdbId: "20506" },
  { title: "Secrets & Lies", year: 1996, tmdbId: "11159" },
  { title: "Underground", year: 1995, tmdbId: "11902" },
  { title: "Pulp Fiction", year: 1994, tmdbId: "680" },
  { title: "Farewell My Concubine", year: 1993, tmdbId: "10997" },
  { title: "The Piano", year: 1993, tmdbId: "713" },
  { title: "The Best Intentions", year: 1992, tmdbId: "41764" },
  { title: "Barton Fink", year: 1991, tmdbId: "290" },
  { title: "Wild at Heart", year: 1990, tmdbId: "483" },
  { title: "Sex, Lies, and Videotape", year: 1989, tmdbId: "1412" },
  { title: "Pelle the Conqueror", year: 1988, tmdbId: "11174" },
  { title: "Under the Sun of Satan", year: 1987, tmdbId: "31300" },
  { title: "The Mission", year: 1986, tmdbId: "11416" },
  { title: "When Father Was Away on Business", year: 1985, tmdbId: "21042" },
  { title: "Paris, Texas", year: 1984, tmdbId: "655" },
  { title: "The Ballad of Narayama", year: 1983, tmdbId: "42113" },
  { title: "Missing", year: 1982, tmdbId: "15600" },
  { title: "Yol", year: 1982, tmdbId: "52556" },
  { title: "Man of Iron", year: 1981, tmdbId: "225" },
  { title: "All That Jazz", year: 1980, tmdbId: "16858" },
  { title: "Kagemusha", year: 1980, tmdbId: "11953" },
  { title: "Apocalypse Now", year: 1979, tmdbId: "28" },
  { title: "The Tin Drum", year: 1979, tmdbId: "659" },
  { title: "The Tree of Wooden Clogs", year: 1978, tmdbId: "31542" },
  { title: "Padre Padrone", year: 1977, tmdbId: "42225" },
  { title: "Taxi Driver", year: 1976, tmdbId: "103" },
  { title: "Chronicle of the Years of Fire", year: 1975, tmdbId: "52555" },
  { title: "The Conversation", year: 1974, tmdbId: "592" },
  { title: "Scarecrow", year: 1973, tmdbId: "31587" },
  { title: "The Hireling", year: 1973, tmdbId: "80382" },
  { title: "The Mattei Affair", year: 1972, tmdbId: "62382" },
  { title: "The Working Class Goes to Heaven", year: 1972, tmdbId: "56231" },
  { title: "The Go-Between", year: 1971, tmdbId: "36194" },
  { title: "MASH", year: 1970, tmdbId: "651" },
  { title: "If....", year: 1969, tmdbId: "14794" },
  { title: "Blowup", year: 1967, tmdbId: "1052" },
  { title: "A Man and a Woman", year: 1966, tmdbId: "42726" },
  {
    title: "The Birds, the Bees and the Italians",
    year: 1966,
    tmdbId: "17974",
  },
  { title: "The Knack ...and How to Get It", year: 1965, tmdbId: "42744" },
  { title: "The Umbrellas of Cherbourg", year: 1964, tmdbId: "5967" },
  { title: "The Leopard", year: 1963, tmdbId: "1040" },
  { title: "O Pagador de Promessas", year: 1962, tmdbId: "59990" },
  { title: "The Long Absence", year: 1961, tmdbId: "131836" },
  { title: "Viridiana", year: 1961, tmdbId: "4497" },
  { title: "La dolce vita", year: 1960, tmdbId: "439" },
  { title: "Black Orpheus", year: 1959, tmdbId: "40423" },
  { title: "The Cranes Are Flying", year: 1958, tmdbId: "38360" },
  { title: "Friendly Persuasion", year: 1957, tmdbId: "43258" },
  { title: "The Silent World", year: 1956, tmdbId: "60234" },
  { title: "Marty", year: 1955, tmdbId: "15919" },
];

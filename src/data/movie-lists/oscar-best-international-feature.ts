import type { MovieListEntry } from "./types";

/**
 * Every winner of the Academy Award for Best International Feature Film,
 * including the years it was called Best Foreign Language Film, most recent
 * first.
 *
 * Source: https://en.wikipedia.org/wiki/Academy_Award_for_Best_International_Feature_Film
 *
 * Starts at 1956, when the award became competitive. The eight films honoured
 * between 1947 and 1955 received Special or Honorary Awards, which is a
 * different thing — the same distinction drawn for the Palme d'Or.
 *
 * `year` is the award year and trails the film by up to two (`La Strada`, a
 * 1954 film, won in 1956), hence this list's `yearTolerance`.
 */
export const OSCAR_BEST_INTERNATIONAL_FEATURE: MovieListEntry[] = [
  { title: "Sentimental Value", year: 2025, tmdbId: "1124566" },
  { title: "I'm Still Here", year: 2024, tmdbId: "1000837" },
  { title: "The Zone of Interest", year: 2023, tmdbId: "467244" },
  { title: "All Quiet on the Western Front", year: 2022, tmdbId: "49046" },
  { title: "Drive My Car", year: 2021, tmdbId: "758866" },
  { title: "Another Round", year: 2020, tmdbId: "580175" },
  { title: "Parasite", year: 2019, tmdbId: "496243" },
  { title: "Roma", year: 2018, tmdbId: "426426" },
  { title: "A Fantastic Woman", year: 2017, tmdbId: "429191" },
  { title: "The Salesman", year: 2016, tmdbId: "375315" },
  { title: "Son of Saul", year: 2015, tmdbId: "336050" },
  { title: "Ida", year: 2014, tmdbId: "209274" },
  { title: "The Great Beauty", year: 2013, tmdbId: "179144" },
  { title: "Amour", year: 2012, tmdbId: "86837" },
  { title: "A Separation", year: 2011, tmdbId: "60243" },
  { title: "In a Better World", year: 2010, tmdbId: "44716" },
  { title: "The Secret in Their Eyes", year: 2009, tmdbId: "25376" },
  { title: "Departures", year: 2008, tmdbId: "16804" },
  { title: "The Counterfeiters", year: 2007, tmdbId: "7862" },
  { title: "The Lives of Others", year: 2006, tmdbId: "582" },
  { title: "Tsotsi", year: 2005, tmdbId: "868" },
  { title: "The Sea Inside", year: 2004, tmdbId: "1913" },
  { title: "The Barbarian Invasions", year: 2003, tmdbId: "11042" },
  { title: "Nowhere in Africa", year: 2002, tmdbId: "1591" },
  { title: "No Man's Land", year: 2001, tmdbId: "8342" },
  { title: "Crouching Tiger, Hidden Dragon", year: 2000, tmdbId: "146" },
  { title: "All About My Mother", year: 1999, tmdbId: "99" },
  { title: "Life Is Beautiful", year: 1998, tmdbId: "637" },
  { title: "Character", year: 1997, tmdbId: "17139" },
  { title: "Kolya", year: 1996, tmdbId: "784" },
  { title: "Antonia's Line", year: 1995, tmdbId: "880" },
  { title: "Burnt by the Sun", year: 1994, tmdbId: "50797" },
  { title: "Belle Époque", year: 1993, tmdbId: "2470" },
  { title: "Indochine", year: 1992, tmdbId: "2731" },
  { title: "Mediterraneo", year: 1991, tmdbId: "38251" },
  { title: "Journey of Hope", year: 1990, tmdbId: "41834" },
  { title: "Cinema Paradiso", year: 1989, tmdbId: "11216" },
  { title: "Pelle the Conqueror", year: 1988, tmdbId: "11174" },
  { title: "Babette's Feast", year: 1987, tmdbId: "11832" },
  { title: "The Assault", year: 1986, tmdbId: "2753" },
  { title: "The Official Story", year: 1985, tmdbId: "29263" },
  { title: "Dangerous Moves", year: 1984, tmdbId: "46088" },
  { title: "Fanny and Alexander", year: 1983, tmdbId: "5961" },
  { title: "Begin the Beguine", year: 1982, tmdbId: "81346" },
  { title: "Mephisto", year: 1981, tmdbId: "11911" },
  { title: "Moscow Does Not Believe in Tears", year: 1980, tmdbId: "21028" },
  { title: "The Tin Drum", year: 1979, tmdbId: "659" },
  { title: "Get Out Your Handkerchiefs", year: 1978, tmdbId: "4267" },
  { title: "Madame Rosa", year: 1977, tmdbId: "42223" },
  { title: "Black and White in Color", year: 1976, tmdbId: "42238" },
  { title: "Dersu Uzala", year: 1975, tmdbId: "9764" },
  { title: "Amarcord", year: 1974, tmdbId: "7857" },
  { title: "Day for Night", year: 1973, tmdbId: "1675" },
  {
    title: "The Discreet Charm of the Bourgeoisie",
    year: 1972,
    tmdbId: "4593",
  },
  { title: "The Garden of the Finzi-Continis", year: 1971, tmdbId: "4789" },
  {
    title: "Investigation of a Citizen Above Suspicion",
    year: 1970,
    tmdbId: "26451",
  },
  { title: "Z", year: 1969, tmdbId: "2721" },
  // Released in four parts; a multi-part work takes its first part's id.
  { title: "War and Peace (film series)", year: 1968, tmdbId: "29266" },
  { title: "Closely Watched Trains", year: 1967, tmdbId: "789" },
  { title: "A Man and a Woman", year: 1966, tmdbId: "42726" },
  { title: "The Shop on Main Street", year: 1965, tmdbId: "25905" },
  { title: "Yesterday, Today and Tomorrow", year: 1964, tmdbId: "42801" },
  { title: "8½", year: 1963, tmdbId: "422" },
  { title: "Sundays and Cybele", year: 1962, tmdbId: "43001" },
  { title: "Through a Glass Darkly", year: 1961, tmdbId: "11602" },
  { title: "The Virgin Spring", year: 1960, tmdbId: "11656" },
  { title: "Black Orpheus", year: 1959, tmdbId: "40423" },
  { title: "Mon Oncle", year: 1958, tmdbId: "427" },
  { title: "Nights of Cabiria", year: 1957, tmdbId: "19426" },
  { title: "La Strada", year: 1956, tmdbId: "405" },
];

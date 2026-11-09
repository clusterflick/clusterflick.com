import type { MovieListEntry } from "./types";

/**
 * Every winner of the Golden Lion, the top prize at the Venice Film Festival,
 * most recent first.
 *
 * Source: https://en.wikipedia.org/wiki/Golden_Lion
 *
 * Runs from 1949, when the Golden Lion replaced the Grand International Prize.
 * Five years have joint winners, and both are kept. No competitive award was
 * made between 1969 and 1979, nor in 1953 and 1956, when the jury declared the
 * prize void, so those years are absent.
 *
 * `year` is the festival year, which can trail the film's release — hence this
 * list's `yearTolerance`.
 */
export const GOLDEN_LION_WINNERS: MovieListEntry[] = [
  { title: "Father Mother Sister Brother", year: 2025, tmdbId: "1159206" },
  { title: "The Room Next Door", year: 2024, tmdbId: "1088514" },
  { title: "Poor Things", year: 2023, tmdbId: "792307" },
  { title: "All the Beauty and the Bloodshed", year: 2022, tmdbId: "1004663" },
  { title: "Happening", year: 2021, tmdbId: "793998" },
  { title: "Nomadland", year: 2020, tmdbId: "581734" },
  { title: "Joker", year: 2019, tmdbId: "475557" },
  { title: "Roma", year: 2018, tmdbId: "426426" },
  { title: "The Shape of Water", year: 2017, tmdbId: "399055" },
  { title: "The Woman Who Left", year: 2016, tmdbId: "408542" },
  { title: "From Afar", year: 2015, tmdbId: "352162" },
  {
    title: "A Pigeon Sat on a Branch Reflecting on Existence",
    year: 2014,
    tmdbId: "110390",
  },
  { title: "Sacro GRA", year: 2013, tmdbId: "216790" },
  { title: "Pietà", year: 2012, tmdbId: "123377" },
  { title: "Faust", year: 2011, tmdbId: "77560" },
  { title: "Somewhere", year: 2010, tmdbId: "39210" },
  { title: "Lebanon", year: 2009, tmdbId: "32084" },
  { title: "The Wrestler", year: 2008, tmdbId: "12163" },
  { title: "Lust, Caution", year: 2007, tmdbId: "4588" },
  { title: "Still Life", year: 2006, tmdbId: "2346" },
  { title: "Brokeback Mountain", year: 2005, tmdbId: "142" },
  { title: "Vera Drake", year: 2004, tmdbId: "11109" },
  { title: "The Return", year: 2003, tmdbId: "11190" },
  { title: "The Magdalene Sisters", year: 2002, tmdbId: "8094" },
  { title: "Monsoon Wedding", year: 2001, tmdbId: "480" },
  { title: "The Circle", year: 2000, tmdbId: "689890" },
  { title: "Not One Less", year: 1999, tmdbId: "36210" },
  { title: "The Way We Laughed", year: 1998, tmdbId: "58098" },
  { title: "Hana-bi", year: 1997, tmdbId: "5910" },
  { title: "Michael Collins", year: 1996, tmdbId: "1770" },
  { title: "Cyclo", year: 1995, tmdbId: "36266" },
  { title: "Before the Rain", year: 1994, tmdbId: "19155" },
  { title: "Vive L'Amour", year: 1994, tmdbId: "11985" },
  { title: "Short Cuts", year: 1993, tmdbId: "695" },
  { title: "Three Colours: Blue", year: 1993, tmdbId: "108" },
  { title: "The Story of Qiu Ju", year: 1992, tmdbId: "38143" },
  { title: "Close to Eden", year: 1991, tmdbId: "36346" },
  { title: "Rosencrantz & Guildenstern Are Dead", year: 1990, tmdbId: "18971" },
  { title: "A City of Sadness", year: 1989, tmdbId: "49982" },
  { title: "The Legend of the Holy Drinker", year: 1988, tmdbId: "54990" },
  { title: "Au revoir les enfants", year: 1987, tmdbId: "1786" },
  { title: "The Green Ray", year: 1986, tmdbId: "54898" },
  { title: "Vagabond", year: 1985, tmdbId: "44018" },
  { title: "A Year of the Quiet Sun", year: 1984, tmdbId: "42096" },
  { title: "First Name: Carmen", year: 1983, tmdbId: "32689" },
  { title: "The State of Things", year: 1982, tmdbId: "30363" },
  { title: "Marianne and Juliane", year: 1981, tmdbId: "42142" },
  { title: "Atlantic City", year: 1980, tmdbId: "23954" },
  { title: "Gloria", year: 1980, tmdbId: "10889" },
  {
    title: "Artists Under the Big Top: Perplexed",
    year: 1968,
    tmdbId: "154582",
  },
  { title: "Belle de Jour", year: 1967, tmdbId: "649" },
  { title: "The Battle of Algiers", year: 1966, tmdbId: "17295" },
  { title: "Sandra", year: 1965, tmdbId: "92432" },
  { title: "Red Desert", year: 1964, tmdbId: "26638" },
  { title: "Hands over the City", year: 1963, tmdbId: "58383" },
  { title: "Family Diary", year: 1962, tmdbId: "80557" },
  { title: "Ivan's Childhood", year: 1962, tmdbId: "31442" },
  { title: "Last Year at Marienbad", year: 1961, tmdbId: "4024" },
  { title: "Tomorrow Is My Turn", year: 1960, tmdbId: "154578" },
  { title: "General Della Rovere", year: 1959, tmdbId: "43100" },
  { title: "The Great War", year: 1959, tmdbId: "55823" },
  { title: "Rickshaw Man", year: 1958, tmdbId: "43121" },
  { title: "Aparajito", year: 1957, tmdbId: "897" },
  { title: "Ordet", year: 1955, tmdbId: "48035" },
  { title: "Romeo and Juliet", year: 1954, tmdbId: "92784" },
  { title: "Forbidden Games", year: 1952, tmdbId: "5000" },
  { title: "Rashomon", year: 1951, tmdbId: "548" },
  { title: "Justice Is Done", year: 1950, tmdbId: "67731" },
  { title: "Manon", year: 1949, tmdbId: "132332" },
];

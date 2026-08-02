import type { MovieListEntry } from "./types";

/**
 * Every winner of the Golden Lion, the top prize at the Venice Film Festival,
 * most recent first.
 *
 * Source: https://en.wikipedia.org/wiki/Golden_Lion
 *
 * Runs from 1949, when the Golden Lion replaced the Grand International Prize.
 * Five years have joint winners, and both are kept. No competitive award was
 * made between 1969 and 1979, so those years are absent.
 *
 * `year` is the festival year, which can trail the film's release — hence this
 * list's `yearTolerance`.
 */
export const GOLDEN_LION_WINNERS: MovieListEntry[] = [
  { title: "Father Mother Sister Brother", year: 2025 },
  { title: "The Room Next Door", year: 2024 },
  { title: "Poor Things", year: 2023 },
  { title: "All the Beauty and the Bloodshed", year: 2022 },
  { title: "Happening", year: 2021 },
  { title: "Nomadland", year: 2020 },
  { title: "Joker", year: 2019 },
  { title: "Roma", year: 2018 },
  { title: "The Shape of Water", year: 2017 },
  { title: "The Woman Who Left", year: 2016 },
  { title: "From Afar", year: 2015 },
  { title: "A Pigeon Sat on a Branch Reflecting on Existence", year: 2014 },
  { title: "Sacro GRA", year: 2013 },
  { title: "Pietà", year: 2012 },
  { title: "Faust", year: 2011 },
  { title: "Somewhere", year: 2010 },
  { title: "Lebanon", year: 2009 },
  { title: "The Wrestler", year: 2008 },
  { title: "Lust, Caution", year: 2007 },
  { title: "Still Life", year: 2006 },
  { title: "Brokeback Mountain", year: 2005 },
  { title: "Vera Drake", year: 2004 },
  { title: "The Return", year: 2003 },
  { title: "The Magdalene Sisters", year: 2002 },
  { title: "Monsoon Wedding", year: 2001 },
  { title: "The Circle", year: 2000 },
  { title: "Not One Less", year: 1999 },
  { title: "The Way We Laughed", year: 1998 },
  { title: "Hana-bi", year: 1997 },
  { title: "Michael Collins", year: 1996 },
  { title: "Cyclo", year: 1995 },
  { title: "Before the Rain", year: 1994 },
  { title: "Vive L'Amour", year: 1994 },
  { title: "Short Cuts", year: 1993 },
  { title: "Three Colours: Blue", year: 1993 },
  { title: "The Story of Qiu Ju", year: 1992 },
  { title: "Close to Eden", year: 1991 },
  { title: "Rosencrantz & Guildenstern Are Dead", year: 1990 },
  { title: "A City of Sadness", year: 1989 },
  { title: "The Legend of the Holy Drinker", year: 1988 },
  { title: "Au revoir les enfants", year: 1987 },
  { title: "The Green Ray", year: 1986 },
  { title: "Vagabond", year: 1985 },
  { title: "A Year of the Quiet Sun", year: 1984 },
  { title: "First Name: Carmen", year: 1983 },
  { title: "The State of Things", year: 1982 },
  { title: "Marianne and Juliane", year: 1981 },
  { title: "Atlantic City", year: 1980 },
  { title: "Gloria", year: 1980 },
  {
    title: "No award given, this edition of the festival was not competitive",
    year: 1979,
  },
  {
    title: "No award given, the festival was not organized this year",
    year: 1978,
  },
  {
    title: "No award given, the festival was not organized this year",
    year: 1977,
  },
  {
    title: "No award given, the festival was not organized during these years",
    year: 1973,
  },
  {
    title: "No award given, the editions of the festival were not competitive",
    year: 1970,
  },
  {
    title: "No award given, this edition of the festival was not competitive",
    year: 1969,
  },
  { title: "Artists Under the Big Top: Perplexed", year: 1968 },
  { title: "Belle de Jour", year: 1967 },
  { title: "The Battle of Algiers", year: 1966 },
  { title: "Sandra", year: 1965 },
  { title: "Red Desert", year: 1964 },
  { title: "Hands over the City", year: 1963 },
  { title: "Family Diary", year: 1962 },
  { title: "Ivan's Childhood", year: 1962 },
  { title: "Last Year at Marienbad", year: 1961 },
  { title: "Tomorrow Is My Turn", year: 1960 },
  { title: "General Della Rovere", year: 1959 },
  { title: "The Great War", year: 1959 },
  { title: "Rickshaw Man", year: 1958 },
  { title: "Aparajito", year: 1957 },
  {
    title:
      "No award given, the jury was unable to decide the winner and the prize was declared void",
    year: 1956,
  },
  { title: "Ordet", year: 1955 },
  { title: "Romeo and Juliet", year: 1954 },
  {
    title:
      "No award given, the jury was unable to decide the winner and the prize was declared void",
    year: 1953,
  },
  { title: "Forbidden Games", year: 1952 },
  { title: "Rashomon", year: 1951 },
  { title: "Justice Is Done", year: 1950 },
  { title: "Manon", year: 1949 },
];

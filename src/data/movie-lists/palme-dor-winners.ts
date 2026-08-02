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
  { title: "Fjord", year: 2026 },
  { title: "It Was Just an Accident", year: 2025 },
  { title: "Anora", year: 2024 },
  { title: "Anatomy of a Fall", year: 2023 },
  { title: "Triangle of Sadness", year: 2022 },
  { title: "Titane", year: 2021 },
  { title: "Parasite", year: 2019 },
  { title: "Shoplifters", year: 2018 },
  { title: "The Square", year: 2017 },
  { title: "I, Daniel Blake", year: 2016 },
  { title: "Dheepan", year: 2015 },
  { title: "Winter Sleep", year: 2014 },
  { title: "Blue Is the Warmest Colour", year: 2013 },
  { title: "Amour", year: 2012 },
  { title: "The Tree of Life", year: 2011 },
  { title: "Uncle Boonmee Who Can Recall His Past Lives", year: 2010 },
  { title: "The White Ribbon", year: 2009 },
  { title: "The Class", year: 2008 },
  { title: "4 Months, 3 Weeks and 2 Days", year: 2007 },
  { title: "The Wind That Shakes the Barley", year: 2006 },
  { title: "L'Enfant", year: 2005 },
  { title: "Fahrenheit 9/11", year: 2004 },
  { title: "Elephant", year: 2003 },
  { title: "The Pianist", year: 2002 },
  { title: "The Son's Room", year: 2001 },
  { title: "Dancer in the Dark", year: 2000 },
  { title: "Rosetta", year: 1999 },
  { title: "Eternity and a Day", year: 1998 },
  { title: "Taste of Cherry", year: 1997 },
  { title: "The Eel", year: 1997 },
  { title: "Secrets & Lies", year: 1996 },
  { title: "Underground", year: 1995 },
  { title: "Pulp Fiction", year: 1994 },
  { title: "Farewell My Concubine", year: 1993 },
  { title: "The Piano", year: 1993 },
  { title: "The Best Intentions", year: 1992 },
  { title: "Barton Fink", year: 1991 },
  { title: "Wild at Heart", year: 1990 },
  { title: "Sex, Lies, and Videotape", year: 1989 },
  { title: "Pelle the Conqueror", year: 1988 },
  { title: "Under the Sun of Satan", year: 1987 },
  { title: "The Mission", year: 1986 },
  { title: "When Father Was Away on Business", year: 1985 },
  { title: "Paris, Texas", year: 1984 },
  { title: "The Ballad of Narayama", year: 1983 },
  { title: "Missing", year: 1982 },
  { title: "Yol", year: 1982 },
  { title: "Man of Iron", year: 1981 },
  { title: "All That Jazz", year: 1980 },
  { title: "Kagemusha", year: 1980 },
  { title: "Apocalypse Now", year: 1979 },
  { title: "The Tin Drum", year: 1979 },
  { title: "The Tree of Wooden Clogs", year: 1978 },
  { title: "Padre Padrone", year: 1977 },
  { title: "Taxi Driver", year: 1976 },
  { title: "Chronicle of the Years of Fire", year: 1975 },
  { title: "The Conversation", year: 1974 },
  { title: "Scarecrow", year: 1973 },
  { title: "The Hireling", year: 1973 },
  { title: "The Mattei Affair", year: 1972 },
  { title: "The Working Class Goes to Heaven", year: 1972 },
  { title: "The Go-Between", year: 1971 },
  { title: "MASH", year: 1970 },
  { title: "If....", year: 1969 },
  { title: "Blowup", year: 1967 },
  { title: "A Man and a Woman", year: 1966 },
  { title: "The Birds, the Bees and the Italians", year: 1966 },
  { title: "The Knack ...and How to Get It", year: 1965 },
  { title: "The Umbrellas of Cherbourg", year: 1964 },
  { title: "The Leopard", year: 1963 },
  { title: "O Pagador de Promessas", year: 1962 },
  { title: "The Long Absence", year: 1961 },
  { title: "Viridiana", year: 1961 },
  { title: "La dolce vita", year: 1960 },
  { title: "Black Orpheus", year: 1959 },
  { title: "The Cranes Are Flying", year: 1958 },
  { title: "Friendly Persuasion", year: 1957 },
  { title: "The Silent World", year: 1956 },
  { title: "Marty", year: 1955 },
];

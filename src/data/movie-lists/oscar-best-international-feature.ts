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
  { title: "Sentimental Value", year: 2025 },
  { title: "I'm Still Here", year: 2024 },
  { title: "The Zone of Interest", year: 2023 },
  { title: "All Quiet on the Western Front", year: 2022 },
  { title: "Drive My Car", year: 2021 },
  { title: "Another Round", year: 2020 },
  { title: "Parasite", year: 2019 },
  { title: "Roma", year: 2018 },
  { title: "A Fantastic Woman", year: 2017 },
  { title: "The Salesman", year: 2016 },
  { title: "Son of Saul", year: 2015 },
  { title: "Ida", year: 2014 },
  { title: "The Great Beauty", year: 2013 },
  { title: "Amour", year: 2012 },
  { title: "A Separation", year: 2011 },
  { title: "In a Better World", year: 2010 },
  { title: "The Secret in Their Eyes", year: 2009 },
  { title: "Departures", year: 2008 },
  { title: "The Counterfeiters", year: 2007 },
  { title: "The Lives of Others", year: 2006 },
  { title: "Tsotsi", year: 2005 },
  { title: "The Sea Inside", year: 2004 },
  { title: "The Barbarian Invasions", year: 2003 },
  { title: "Nowhere in Africa", year: 2002 },
  { title: "No Man's Land", year: 2001 },
  { title: "Crouching Tiger, Hidden Dragon", year: 2000 },
  { title: "All About My Mother", year: 1999 },
  { title: "Life Is Beautiful", year: 1998 },
  { title: "Character", year: 1997 },
  { title: "Kolya", year: 1996 },
  { title: "Antonia's Line", year: 1995 },
  { title: "Burnt by the Sun", year: 1994 },
  { title: "Belle Époque", year: 1993 },
  { title: "Indochine", year: 1992 },
  { title: "Mediterraneo", year: 1991 },
  { title: "Journey of Hope", year: 1990 },
  { title: "Cinema Paradiso", year: 1989 },
  { title: "Pelle the Conqueror", year: 1988 },
  { title: "Babette's Feast", year: 1987 },
  { title: "The Assault", year: 1986 },
  { title: "The Official Story", year: 1985 },
  { title: "Dangerous Moves", year: 1984 },
  { title: "Fanny and Alexander", year: 1983 },
  { title: "Begin the Beguine", year: 1982 },
  { title: "Mephisto", year: 1981 },
  { title: "Moscow Does Not Believe in Tears", year: 1980 },
  { title: "The Tin Drum", year: 1979 },
  { title: "Get Out Your Handkerchiefs", year: 1978 },
  { title: "Madame Rosa", year: 1977 },
  { title: "Black and White in Color", year: 1976 },
  { title: "Dersu Uzala", year: 1975 },
  { title: "Amarcord", year: 1974 },
  { title: "Day for Night", year: 1973 },
  { title: "The Discreet Charm of the Bourgeoisie", year: 1972 },
  { title: "The Garden of the Finzi-Continis", year: 1971 },
  { title: "Investigation of a Citizen Above Suspicion", year: 1970 },
  { title: "Z", year: 1969 },
  { title: "War and Peace (film series)", year: 1968 },
  { title: "Closely Watched Trains", year: 1967 },
  { title: "A Man and a Woman", year: 1966 },
  { title: "The Shop on Main Street", year: 1965 },
  { title: "Yesterday, Today and Tomorrow", year: 1964 },
  { title: "8½", year: 1963 },
  { title: "Sundays and Cybele", year: 1962 },
  { title: "Through a Glass Darkly", year: 1961 },
  { title: "The Virgin Spring", year: 1960 },
  { title: "Black Orpheus", year: 1959 },
  { title: "Mon Oncle", year: 1958 },
  { title: "Nights of Cabiria", year: 1957 },
  { title: "La Strada", year: 1956 },
];

/**
 * The numbers behind /reports/lewisham-2026: a snapshot, not a live count.
 *
 * Every screening listed from 2026-01-01 to 2026-10-19 was rebuilt from that
 * period's daily data-combined releases, each release supplying the
 * screenings up to the next one (the everycinema.london history method), so
 * nothing is counted twice. Only film screenings count: films, shorts, double
 * bills and TV, not talks, music or other events. Each venue is placed in a
 * borough by its coordinates, as the borough pages do, and a venue that
 * changed id during the year is counted once.
 */
export const LEWISHAM_2026 = {
  from: "2026-01-01",
  to: "2026-10-19",
  days: 292,
  londonScreenings: 826804,
  venuesWithScreenings: 418,
  venuesWithScreeningsInJanuary: 182,
  /** ONS mid-2024 population estimates. */
  population: { lewisham: 301255, london: 9089736 },
  boroughs: [
    { slug: "westminster", screenings: 74327 },
    { slug: "hammersmith-and-fulham", screenings: 55679 },
    { slug: "greenwich", screenings: 50910 },
    { slug: "camden", screenings: 47672 },
    { slug: "islington", screenings: 38154 },
    { slug: "hounslow", screenings: 35159 },
    { slug: "haringey", screenings: 35066 },
    { slug: "newham", screenings: 34899 },
    { slug: "bromley", screenings: 34296 },
    { slug: "enfield", screenings: 32111 },
    { slug: "havering", screenings: 29155 },
    { slug: "lambeth", screenings: 27784 },
    { slug: "tower-hamlets", screenings: 25488 },
    { slug: "kingston-upon-thames", screenings: 24089 },
    { slug: "hillingdon", screenings: 23857 },
    { slug: "wandsworth", screenings: 23559 },
    { slug: "barnet", screenings: 23070 },
    { slug: "ealing", screenings: 22120 },
    { slug: "harrow", screenings: 20318 },
    { slug: "redbridge", screenings: 20060 },
    { slug: "merton", screenings: 18466 },
    { slug: "croydon", screenings: 17749 },
    { slug: "hackney", screenings: 13912 },
    { slug: "southwark", screenings: 13852 },
    { slug: "bexley", screenings: 13732 },
    { slug: "barking-and-dagenham", screenings: 12447 },
    { slug: "sutton", screenings: 12056 },
    { slug: "brent", screenings: 12044 },
    { slug: "richmond-upon-thames", screenings: 11738 },
    { slug: "kensington-and-chelsea", screenings: 8551 },
    { slug: "waltham-forest", screenings: 8497 },
    { slug: "city-of-london", screenings: 5899 },
    { slug: "lewisham", screenings: 88 },
  ],
  lewishamVenues: [
    { name: "Deptford Lounge", type: "Library & Archive", screenings: 31 },
    { name: "Goldsmiths", type: "University & College", screenings: 18 },
    { name: "Piehouse Co-Op", type: "Community Cinema", screenings: 8 },
    { name: "Sydenham Arts", type: "Community Cinema", screenings: 7 },
    { name: "The Fellowship Inn", type: "Pub & Bar", screenings: 6 },
    { name: "Telegraph Hill Centre", type: "Community Centre", screenings: 5 },
    {
      name: "Triangle LGBTQ+ Cultural Centre",
      type: "Cultural Centre",
      screenings: 3,
    },
    { name: "The Brookmill", type: "Pub & Bar", screenings: 2 },
    { name: "AMP Studios", type: "Creative Space", screenings: 2 },
    { name: "Art Hub Studios", type: "Creative Space", screenings: 2 },
    { name: "Rivoli Ballroom", type: "Music Venue", screenings: 1 },
    { name: "Shapes Lewisham", type: "Arts Centre", screenings: 1 },
    { name: "New Cross Inn", type: "Music Venue", screenings: 1 },
    {
      name: "Harris Institute of Teaching and Leadership",
      type: "University & College",
      screenings: 1,
    },
  ],
  lewishamByMonth: {
    "2026-01": 3,
    "2026-02": 15,
    "2026-03": 6,
    "2026-04": 3,
    "2026-05": 8,
    "2026-06": 7,
    "2026-07": 18,
    "2026-08": 5,
    "2026-09": 14,
    "2026-10": 9,
  },
} as const;

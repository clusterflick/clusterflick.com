/**
 * The numbers behind /reports/lewisham-2026: a snapshot, not a live count.
 *
 * Every screening listed from 2026-01-01 to 2026-10-31 was rebuilt from that
 * period's daily data-combined releases, each release supplying the
 * screenings up to the next one (the everycinema.london history method), so
 * nothing is counted twice. Only film screenings count: films, shorts, double
 * bills and TV, not talks, music or other events. Each venue is placed in a
 * borough by its coordinates, as the borough pages do, and a venue that
 * changed id during the year is counted once.
 */
export const LEWISHAM_2026 = {
  from: "2026-01-01",
  to: "2026-10-31",
  days: 304,
  londonScreenings: 863909,
  venuesWithScreenings: 444,
  venuesWithScreeningsInJanuary: 182,
  /**
   * The time of day Westminster's 103rd film screening starts, as the median
   * over every day in the period (every day reached 103).
   */
  westminsterPassesLewishamAt: "15:00",
  /** ONS mid-2024 population estimates. */
  population: { lewisham: 301255, london: 9089736 },
  boroughs: [
    { slug: "westminster", screenings: 77699 },
    { slug: "hammersmith-and-fulham", screenings: 57695 },
    { slug: "greenwich", screenings: 53242 },
    { slug: "camden", screenings: 50021 },
    { slug: "islington", screenings: 39913 },
    { slug: "hounslow", screenings: 36684 },
    { slug: "haringey", screenings: 36650 },
    { slug: "newham", screenings: 36392 },
    { slug: "bromley", screenings: 35944 },
    { slug: "enfield", screenings: 33614 },
    { slug: "havering", screenings: 30303 },
    { slug: "lambeth", screenings: 29089 },
    { slug: "tower-hamlets", screenings: 26567 },
    { slug: "kingston-upon-thames", screenings: 25227 },
    { slug: "hillingdon", screenings: 24945 },
    { slug: "wandsworth", screenings: 24655 },
    { slug: "barnet", screenings: 24115 },
    { slug: "ealing", screenings: 23141 },
    { slug: "harrow", screenings: 21228 },
    { slug: "redbridge", screenings: 20963 },
    { slug: "merton", screenings: 19345 },
    { slug: "croydon", screenings: 18344 },
    { slug: "hackney", screenings: 14575 },
    { slug: "southwark", screenings: 14521 },
    { slug: "bexley", screenings: 14349 },
    { slug: "barking-and-dagenham", screenings: 13058 },
    { slug: "brent", screenings: 12620 },
    { slug: "sutton", screenings: 12568 },
    { slug: "richmond-upon-thames", screenings: 12307 },
    { slug: "kensington-and-chelsea", screenings: 8947 },
    { slug: "waltham-forest", screenings: 8903 },
    { slug: "city-of-london", screenings: 6182 },
    { slug: "lewisham", screenings: 103 },
  ],
  lewishamVenues: [
    {
      id: "lewisham.gov.uk-deptford-lounge",
      /** First month Clusterflick followed the venue. */
      followedFrom: "2026-01",
      name: "Deptford Lounge",
      type: "Library & Archive",
      screenings: 34,
    },
    {
      id: "gold.ac.uk",
      followedFrom: "2026-01",
      name: "Goldsmiths",
      type: "University & College",
      screenings: 20,
    },
    {
      id: "fellowshipinn.co.uk",
      followedFrom: "2026-01",
      name: "The Fellowship Inn",
      type: "Pub & Bar",
      screenings: 9,
    },
    {
      id: "sydenhamarts.co.uk",
      followedFrom: "2026-02",
      name: "Sydenham Arts",
      type: "Community Cinema",
      screenings: 8,
    },
    {
      id: "piehousecoop.co.uk",
      followedFrom: "2026-01",
      name: "Piehouse Co-Op",
      type: "Community Cinema",
      screenings: 8,
    },
    {
      id: "thcentre.com",
      followedFrom: "2026-02",
      name: "Telegraph Hill Centre",
      type: "Community Centre",
      screenings: 7,
    },
    {
      id: "rivoliballroom.com",
      followedFrom: "2026-01",
      name: "Rivoli Ballroom",
      type: "Music Venue",
      screenings: 4,
    },
    {
      id: "triangledeptford.org",
      followedFrom: "2026-01",
      name: "Triangle LGBTQ+ Cultural Centre",
      type: "Cultural Centre",
      screenings: 3,
    },
    {
      id: "thebrookmill.co.uk",
      followedFrom: "2026-07",
      name: "The Brookmill",
      type: "Pub & Bar",
      screenings: 3,
    },
    {
      id: "ampstudios.co.uk",
      followedFrom: "2026-08",
      name: "AMP Studios",
      type: "Creative Space",
      screenings: 2,
    },
    {
      id: "arthub.org.uk",
      followedFrom: "2026-09",
      name: "Art Hub Studios",
      type: "Creative Space",
      screenings: 2,
    },
    {
      id: "shapeslewisham.co.uk",
      followedFrom: "2026-07",
      name: "Shapes Lewisham",
      type: "Arts Centre",
      screenings: 1,
    },
    {
      id: "newcrossinn.com",
      followedFrom: "2026-06",
      name: "New Cross Inn",
      type: "Music Venue",
      screenings: 1,
    },
    {
      id: "harrisinstitute.org.uk",
      followedFrom: "2026-07",
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
    "2026-10": 24,
  },
} as const;

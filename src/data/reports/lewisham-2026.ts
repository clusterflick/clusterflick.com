/**
 * The numbers behind /reports/lewisham-2026: a snapshot, not a live count.
 *
 * Every screening listed from 2026-01-01 to 2026-10-29 was rebuilt from that
 * period's daily data-combined releases, each release supplying the
 * screenings up to the next one (the everycinema.london history method), so
 * nothing is counted twice. Only film screenings count: films, shorts, double
 * bills and TV, not talks, music or other events. Each venue is placed in a
 * borough by its coordinates, as the borough pages do, and a venue that
 * changed id during the year is counted once.
 */
export const LEWISHAM_2026 = {
  from: "2026-01-01",
  to: "2026-10-29",
  days: 302,
  londonScreenings: 857157,
  venuesWithScreenings: 439,
  venuesWithScreeningsInJanuary: 182,
  /**
   * The time of day Westminster's 94th film screening starts, as the median
   * over every day in the period (every day reached 94).
   */
  westminsterPassesLewishamAt: "14:40",
  /** ONS mid-2024 population estimates. */
  population: { lewisham: 301255, london: 9089736 },
  boroughs: [
    { slug: "westminster", screenings: 77110 },
    { slug: "hammersmith-and-fulham", screenings: 57324 },
    { slug: "greenwich", screenings: 52806 },
    { slug: "camden", screenings: 49594 },
    { slug: "islington", screenings: 39591 },
    { slug: "hounslow", screenings: 36397 },
    { slug: "haringey", screenings: 36371 },
    { slug: "newham", screenings: 36128 },
    { slug: "bromley", screenings: 35661 },
    { slug: "enfield", screenings: 33336 },
    { slug: "havering", screenings: 30106 },
    { slug: "lambeth", screenings: 28847 },
    { slug: "tower-hamlets", screenings: 26381 },
    { slug: "kingston-upon-thames", screenings: 25037 },
    { slug: "hillingdon", screenings: 24730 },
    { slug: "wandsworth", screenings: 24453 },
    { slug: "barnet", screenings: 23929 },
    { slug: "ealing", screenings: 22947 },
    { slug: "harrow", screenings: 21070 },
    { slug: "redbridge", screenings: 20784 },
    { slug: "merton", screenings: 19175 },
    { slug: "croydon", screenings: 18243 },
    { slug: "hackney", screenings: 14452 },
    { slug: "southwark", screenings: 14389 },
    { slug: "bexley", screenings: 14242 },
    { slug: "barking-and-dagenham", screenings: 12949 },
    { slug: "brent", screenings: 12501 },
    { slug: "sutton", screenings: 12478 },
    { slug: "richmond-upon-thames", screenings: 12201 },
    { slug: "kensington-and-chelsea", screenings: 8875 },
    { slug: "waltham-forest", screenings: 8835 },
    { slug: "city-of-london", screenings: 6121 },
    { slug: "lewisham", screenings: 94 },
  ],
  lewishamVenues: [
    {
      id: "lewisham.gov.uk-deptford-lounge",
      /** First month Clusterflick followed the venue. */
      followedFrom: "2026-01",
      name: "Deptford Lounge",
      type: "Library & Archive",
      screenings: 33,
    },
    {
      id: "gold.ac.uk",
      followedFrom: "2026-01",
      name: "Goldsmiths",
      type: "University & College",
      screenings: 18,
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
      id: "fellowshipinn.co.uk",
      followedFrom: "2026-01",
      name: "The Fellowship Inn",
      type: "Pub & Bar",
      screenings: 6,
    },
    {
      id: "thcentre.com",
      followedFrom: "2026-02",
      name: "Telegraph Hill Centre",
      type: "Community Centre",
      screenings: 5,
    },
    {
      id: "triangledeptford.org",
      followedFrom: "2026-01",
      name: "Triangle LGBTQ+ Cultural Centre",
      type: "Cultural Centre",
      screenings: 3,
    },
    {
      id: "rivoliballroom.com",
      followedFrom: "2026-01",
      name: "Rivoli Ballroom",
      type: "Music Venue",
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
    "2026-10": 15,
  },
} as const;

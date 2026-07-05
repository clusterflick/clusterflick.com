export type VenueGroup = {
  /** Display name, e.g. "ODEON". */
  name: string;
  /** URL slug and logo filename base, e.g. "odeon". */
  slug: string;
  /** Must match `venue.groupName` in the combined dataset, e.g. "Odeon". */
  groupName: string;
  /**
   * Optional override for the prose form used in "Part of the {…} group".
   * By default "Cinema" is appended when absent (e.g. "Curzon" → "Curzon
   * Cinema"); set this for names that read badly with "Cinema" appended.
   */
  fullName?: string;
  /**
   * Optional social handle overrides for the group page. The page first infers
   * shared corporate accounts from the group's venues (see getGroupCorporateSocials);
   * anything set here takes precedence — use it to fill gaps where no shared
   * account is detectable (e.g. chains with per-venue accounts). Handles only
   * (no URL), e.g. `{ instagram: "picturehouses" }`.
   */
  socials?: {
    letterboxd?: string;
    twitter?: string;
    instagram?: string;
  };
  /** SEO/marketing blurb shown on the group page. */
  description: string;
};

/**
 * Cinema chains with a dedicated group page at `/cinema-groups/<slug>`.
 *
 * Inclusion rule (structural, not schedule-based, so pages never blink in and
 * out of existence): the group must have `structure === "group"`, at least two
 * venues, and cinema-type venues. Hotels, universities, museums, bars and
 * single-venue "groups" are intentionally excluded — see the venue-group plan.
 *
 * `groupName` is the join key back to `venue.groupName`; `slug` is also the
 * logo filename base under `public/images/venues/<slug>.{jpg,png,svg}`.
 */
export const VENUE_GROUPS: VenueGroup[] = [
  {
    name: "Picturehouse",
    slug: "picturehouse",
    groupName: "Picturehouse",
    // Per-venue Instagram/X accounts, so no shared account is auto-detected;
    // fall back to the corporate handles.
    socials: { instagram: "picturehouses", twitter: "picturehouses" },
    description:
      "Picturehouse is an independent-minded cinema chain blending the latest releases with arthouse, independent and world cinema, alongside Q&As, members' events and live event screenings. Its London picture houses include the much-loved Ritzy in Brixton, Hackney, Clapham and the flagship Picturehouse Central near Piccadilly.",
  },
  {
    name: "Everyman",
    slug: "everyman",
    groupName: "Everyman",
    description:
      "Everyman is a premium boutique cinema group known for sofa seating, table service and freshly made food and drink brought to your seat. Its London venues screen new releases, classics and event cinema in a relaxed, living-room atmosphere across neighbourhoods from Hampstead to Canary Wharf.",
  },
  {
    name: "Curzon",
    slug: "curzon",
    groupName: "Curzon",
    // Per-venue Instagram/X accounts, so no shared account is auto-detected;
    // fall back to the corporate handles.
    socials: { instagram: "curzoncinemas", twitter: "CurzonCinemas" },
    description:
      "Curzon is one of London's most storied arthouse cinema groups, championing independent, foreign-language and documentary film through its cinemas and its own distribution label. From Curzon Soho and Mayfair to Bloomsbury and Aldgate, it pairs bold programming with intimate, design-led screening rooms.",
  },
  {
    name: "ODEON",
    slug: "odeon",
    groupName: "Odeon",
    description:
      "ODEON is one of the UK's largest cinema chains, showing the latest blockbusters and event cinema on big screens across Greater London. Many sites are ODEON Luxe venues with fully reclining seats, and its flagship on Leicester Square is one of the country's most iconic cinemas.",
  },
  {
    name: "Vue",
    slug: "vue",
    groupName: "Vue",
    description:
      "Vue is a major multiplex chain screening the latest mainstream releases with big screens and reclining seats across London. With venues from Piccadilly to the outer boroughs, it's a dependable home for new blockbusters and family films.",
  },
  {
    name: "Cineworld",
    slug: "cineworld",
    groupName: "Cineworld",
    description:
      "Cineworld is a leading multiplex chain showing the latest blockbusters, including premium formats such as IMAX, 4DX and ScreenX. Its London sites span the outer boroughs and the flagship in Leicester Square, the largest cinema in the UK.",
  },
  {
    name: "BFI",
    slug: "bfi",
    groupName: "BFI",
    fullName: "BFI",
    description:
      "The BFI (British Film Institute) is the UK's lead organisation for film, curating classic, world and rarely screened archive cinema. Its London homes are BFI Southbank, the giant-screen BFI IMAX at Waterloo, and preview screenings at BFI Stephen Street.",
  },
  {
    name: "Olympic Studios",
    slug: "olympic-studios",
    groupName: "Olympic Studios",
    fullName: "Olympic Studios",
    description:
      "Olympic Studios runs a small family of boutique, design-led cinemas born from the legendary Olympic recording studios in Barnes. Its screens combine plush surroundings with dining and members' spaces, including venues at Selfridges and Battersea Power Station.",
  },
  {
    name: "Rooftop Cinema Club",
    slug: "rooftop-cinema-club",
    groupName: "Rooftop Cinema Club",
    description:
      "Rooftop Cinema Club offers open-air film screenings with wireless headphones, deckchairs and skyline views. Its seasonal London rooftops in Peckham and Stratford show a mix of classics, cult favourites and recent hits under the stars.",
  },
  {
    name: "Castle Cinema",
    slug: "castle-cinema",
    groupName: "Castle Cinema",
    description:
      "The Castle Cinema is an independent, community-spirited group offering a warm, boutique alternative to the multiplex. Its venues in Homerton and Sidcup pair new releases, classics and independent film with a friendly bar.",
  },
  {
    name: "Electric Cinema",
    slug: "electric-cinema",
    groupName: "Electric Cinema",
    description:
      "Electric Cinema is home to one of Britain's oldest working cinemas on Portobello Road, offering a luxurious experience with armchairs, sofas and footstools. Part of Soho House, its Portobello and White City screens pair new releases with a stylish, comfortable setting.",
  },
];

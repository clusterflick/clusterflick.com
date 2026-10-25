import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Shoreditch Arts Club is a private members&apos; club at 6 Redchurch
        Street in <Link href="/london-cinemas/hackney/">Hackney</Link>, which
        calls itself &quot;a private space where a community of artists,
        curators and hosts co-create the cultural moments&quot;. Alongside a
        double-height lobby and rooms for dining and workshops, the building has
        its own cinema and a screening lounge.
      </p>
      <p>
        Its programme is a monthly calendar of live performance, screenings,
        conversations and installations, made with artists, galleries and
        cultural institutions. Film arrives through that programme rather than a
        regular cinema schedule, put on by the club itself and by the curators
        and members who use the space for their own events.
      </p>
    </section>
  );
}

export const seoDescription =
  "Shoreditch members' club with its own cinema room";
export const seoHighlights =
  "artist-led screenings alongside talks and performance";

export default VenueBlurb;

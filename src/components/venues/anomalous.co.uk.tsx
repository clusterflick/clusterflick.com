import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Anomalous Space takes up three adjoining Georgian townhouses on
        Pentonville Road, between Angel and King&apos;s Cross in{" "}
        <Link href="/london-cinemas/islington/">Islington</Link>. The building
        dates from the 1770s, was once home to Victorian London&apos;s cabinet
        makers, and keeps its original fireplaces, swing doors and Art Deco
        details &mdash; it describes itself as &quot;not your white-walled,
        generic hire venue and it never has been.&quot;
      </p>
      <p>
        Its rooms are hired out for meetings, workshops, photoshoots, wellbeing
        sessions and socials, with the largest, The Home, seating 50. Income
        from corporate bookings is put back into freelancers, small charities
        and underrepresented communities through its Anomalous Social Club. Film
        comes in the same way: screenings here are put on by clubs and promoters
        hiring the space.
      </p>
    </section>
  );
}

export const seoDescription =
  "Georgian townhouse hire venue on Pentonville Road";
export const seoHighlights = "film nights from clubs hiring the space";

export default VenueBlurb;

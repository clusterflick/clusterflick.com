import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Rhizomatic! is a craft cafe, workshop space and wine bar on the first
        floor of Algha Works on Smeed Road, on the Fish Island side of Hackney
        Wick in <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>
        . It calls itself &quot;LDN&apos;s newest FLINTA craft cafe, wine bar,
        &amp; third space centering textiles, tech, &amp; everything that grows
        between&quot;.
      </p>
      <p>
        Its events are made for the meeting point of textiles, technology and
        art, and screenings are one part of that programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "FLINTA craft cafe, wine bar and workshop space in Hackney Wick";
export const seoHighlights = "film screenings, textiles and tech events";

export default VenueBlurb;

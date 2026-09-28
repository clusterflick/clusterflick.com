import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Enfield Town Library stands on Church Street &quot;in the heart of
        Enfield&quot;, in <Link href="/london-cinemas/enfield/">Enfield</Link>,
        and is both a public library and one of the council&apos;s community
        hubs, offering face-to-face help with money, jobs, health and housing.
      </p>
      <p>
        Its community room, equipped with a projector and screen, is used for
        meetings and local events, and the library&apos;s screenings range from
        that room to outdoor movie nights on the library green, bringing films
        to the middle of the town centre.
      </p>
    </section>
  );
}

export const seoDescription =
  "public library and community hub in Enfield Town";
export const seoHighlights = "outdoor movie nights on the library green";

export default VenueBlurb;

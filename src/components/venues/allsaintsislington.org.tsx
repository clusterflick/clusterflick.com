import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        All Saints Church is a community church on Carnegie Street in{" "}
        <Link href="/london-cinemas/islington/">Islington</Link>, close to
        Caledonian Road. The venue hosts a range of community events alongside
        its regular programme of worship and gatherings.
      </p>
    </section>
  );
}

export const seoDescription = "Community church and events venue in Islington";
export const seoHighlights = "community screenings and events";

export default VenueBlurb;

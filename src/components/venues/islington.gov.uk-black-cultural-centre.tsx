import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Black Cultural Centre Islington is a community centre on Hornsey
        Road in North London, run by{" "}
        <Link href="/london-cinemas/islington/">Islington</Link> Council. The
        centre is dedicated to celebrating and promoting Black culture,
        heritage, and community life in the borough. It hosts a programme of
        events including film screenings, exhibitions, talks, workshops, and
        cultural celebrations.
      </p>
    </section>
  );
}

export const seoDescription = "Islington Black culture community centre";
export const seoHighlights =
  "culturally focused screenings, exhibitions and community events";

export default VenueBlurb;

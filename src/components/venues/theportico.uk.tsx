import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Portico is a space for community and creative projects at 23a
        Knights Hill in West Norwood, in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>. It occupies a
        Victorian public hall dating back to 1885, built to bring popular
        entertainment to the people of Norwood in the music hall tradition, and
        Charlie Chaplin reputedly performed on its stage.
      </p>
      <p>
        The Main Hall holds 250 to 350 people, with a full-sized stage and a
        licensed bar, and there is a Substage and a Thrift Market too. Film sits
        with arts, music, dance and wellness among the projects it supports, and
        The Portico organises screenings of its own.
      </p>
    </section>
  );
}

export const seoDescription =
  "community arts space in a Victorian West Norwood public hall";
export const seoHighlights = "screenings, live music and community projects";

export default VenueBlurb;

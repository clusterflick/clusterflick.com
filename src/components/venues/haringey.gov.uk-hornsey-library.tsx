import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Hornsey Library is a Grade II listed building on Haringey Park, &quot;in
        the heart of Crouch End&quot;, in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>. Its art includes
        the engraved Hornsey Window by Fred Mitchell and a bronze sculpture by
        Huxley-Jones, and it runs two commercial galleries: the Original Gallery
        and the Promenade Gallery.
      </p>
      <p>
        Alongside books, DVDs, study spaces and meeting rooms for hire, the
        council lists &quot;regular events for adults and children, including
        film showings&quot;, putting free screenings into the library&apos;s own
        programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "Grade II listed public library and gallery in Crouch End";
export const seoHighlights = "free film showings in a listed library";

export default VenueBlurb;

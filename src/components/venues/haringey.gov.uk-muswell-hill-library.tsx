import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Muswell Hill Library is a Grade II listed building on Queens Avenue,
        just off the Broadway in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>, and one of the
        borough&apos;s public libraries, with fiction and non-fiction for adults
        and children, DVDs to rent, computers, study spaces and meeting rooms
        for hire.
      </p>
      <p>
        The council describes its libraries as hosting &quot;regular events for
        adults and children, including film showings, early years activities,
        and book readings&quot;, so screenings here are part of the
        library&apos;s own free programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "Grade II listed public library off Muswell Hill Broadway";
export const seoHighlights = "free film showings in a local library";

export default VenueBlurb;

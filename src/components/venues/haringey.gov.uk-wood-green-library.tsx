import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Wood Green Library is the large public library on the High Road in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>, and more than a
        lending library: it also houses the council&apos;s Contact Centre and
        Haringey Learns, the borough&apos;s adult learning service, alongside
        computers, study spaces and meeting rooms for hire.
      </p>
      <p>
        Its programme of &quot;regular events for adults and children, including
        film showings, early years activities, and book readings&quot; brings
        free screenings to one of the busiest streets in north London.
      </p>
    </section>
  );
}

export const seoDescription =
  "public library and council hub on Wood Green High Road";
export const seoHighlights = "free film showings on the High Road";

export default VenueBlurb;

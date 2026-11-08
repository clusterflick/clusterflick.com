import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St Mary&apos;s Barnes is the Church of England parish church on Church
        Road in Barnes,{" "}
        <Link href="/london-cinemas/richmond-upon-thames/">
          Richmond upon Thames
        </Link>
        . It grew from a 12th-century chapel, said to have been dedicated by
        Archbishop Stephen Langton on his way back from Magna Carta in 1215.
        After a fire in 1978, Edward Cullinan rebuilt it around the surviving
        medieval walls and Tudor tower.
      </p>
      <p>
        It calls itself &quot;a wonderful venue for musical, dramatic, literary
        or any type of public event&quot;, and the main church seats around 200,
        with movable seating and a projection screen. Its screenings come from
        groups hiring the church.
      </p>
    </section>
  );
}

export const seoDescription = "Grade II* listed parish church in Barnes";
export const seoHighlights = "community film screenings in a medieval church";

export default VenueBlurb;

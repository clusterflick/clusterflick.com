import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Joe Allen is &quot;the original New York theatreland brasserie&quot;, on
        Burleigh Street just behind the Covent Garden Piazza in{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>. Its
        namesake opened the first Joe Allen on West 46th Street in 1965, and the
        London restaurant has been serving martinis, burgers and late-night
        classics to West End audiences since 1977 &mdash; &quot;a theatre
        restaurant through-and-through&quot;.
      </p>
      <p>
        On selected Sundays the restaurant becomes a cinema for the afternoon,
        with lunch and late-afternoon mystery movie showings. Tickets are sold
        as tables of two, and guests get an hour to order and eat before the
        film begins &mdash; &quot;the perfect dine-and-watch experience&quot;.
      </p>
    </section>
  );
}

export const seoDescription =
  "New York-style theatreland brasserie in Covent Garden";
export const seoHighlights = "Sunday mystery movie dine-and-watch screenings";

export default VenueBlurb;

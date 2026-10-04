import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Kingston Methodist Church stands on Fairfield South, beside the
        Fairfield in central{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>. Its
        congregation is &quot;a wonderful mix of people of all ages, originating
        from many parts of the world&quot;, and Sunday worship is
        &quot;traditional in format but very relaxed&quot;.
      </p>
      <p>
        Beyond services the building is a community venue, home to a preschool
        and with an upper hall for up to 100 people, a lower hall and a smaller
        carpeted room for hire. Screenings here are community events held in
        those halls.
      </p>
    </section>
  );
}

export const seoDescription =
  "Methodist church and community halls in Kingston";
export const seoHighlights = "community screenings in the church halls";

export default VenueBlurb;

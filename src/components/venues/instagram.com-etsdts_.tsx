import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Eat the Sunshine . Down the Sun is at Kennington Cross in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>, and calls itself
        &quot;a dynamic cosy cafe and experimental art space&quot;. The two
        halves of the name are its two floors: Eat the Sunshine is the
        ground-floor café, serving Filipino rice bowls and burritos built to
        order, with coffee and cakes in the morning and beer in the evening.
      </p>
      <p>
        Down the Sun is the basement, once the old café&apos;s kitchen and now a
        gallery given over to experimental and sonic art. Screenings sit within
        what the art space puts on, beside its exhibitions and sound work.
      </p>
    </section>
  );
}

export const seoDescription =
  "Filipino café and basement art space at Kennington Cross";
export const seoHighlights = "screenings in an experimental art space";

export default VenueBlurb;

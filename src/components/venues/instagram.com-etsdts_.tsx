import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Eat the Sunshine . Down the Sun is at Kennington Cross in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>, and calls itself
        &quot;a dynamic cosy cafe and experimental art space&quot;. The two
        halves of the name are its two floors: Eat the Sunshine is the
        ground-floor café, serving Filipino food by day and staying open for
        beer on some evenings.
      </p>
      <p>
        Down the Sun is the basement, once the old café&apos;s kitchen and now a
        gallery given over to experimental and sonic art. Film arrives through
        its sound and performance nights, where artists&apos; video is screened
        among live sets.
      </p>
    </section>
  );
}

export const seoDescription =
  "Filipino café and basement art space at Kennington Cross";
export const seoHighlights = "artists' video at sound and performance nights";

export default VenueBlurb;

import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Plaza Camden occupies a 1937 cinema building on Parkway, a few steps
        from Camden Town station in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>. It describes itself
        as &quot;a 1937 super cinema, reawakened in Camden&quot;, and has been
        revived as an independent arts space that runs from day into night, with
        a café and an art gallery open through the day.
      </p>
      <p>
        Film is back as one strand of a mixed programme: indie and classic
        screenings, some with Q&amp;As, alongside fringe theatre, live music and
        DJ sets, plus film for children.
      </p>
    </section>
  );
}

export const seoDescription = "a 1937 Camden super cinema, reawakened";
export const seoHighlights =
  "indie and classic film alongside theatre, music and art";

export default VenueBlurb;

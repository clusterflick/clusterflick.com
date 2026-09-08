import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Staffordshire St is a not-for-profit arts space and artists&apos;
        studios in Peckham,{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, founded in
        2022 and describing itself as &quot;a dynamic, inclusive arts space with
        artists studios &hellip; that challenges convention and nurtures both
        local and artistic communities&quot;. Over 25 artists and cultural
        practitioners work from the building, across painting, ceramics,
        printmaking and photography as well as architecture, design and
        performance.
      </p>
      <p>
        Alongside the studios it programmes exhibitions and events as &quot;a
        platform for critical visual arts and stimulating events alongside a
        place for music, performance, dance and theatre&quot;, running strands
        including Word Club, Makes and Open Studios.
      </p>
      <p>
        Film comes in through STST Film Club, which the venue says provides
        &quot;collectives, curators and audiences with a space to explore
        cinematic conversations, push the boundaries of experimental film and
        showcase archival heritage footage&quot;.
      </p>
    </section>
  );
}

export const seoDescription =
  "not-for-profit Peckham arts space and artists' studios";
export const seoHighlights =
  "STST Film Club screenings of experimental and archival film";

export default VenueBlurb;

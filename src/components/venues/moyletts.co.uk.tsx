import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Moylett&apos;s is an independent Irish pub on the corner of Clarence
        Road and Downs Road in Lower Clapton,{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, run as &quot;a
        family business inspired by our Éirean roots&quot;. The Victorian
        building has had many lives before it, from The Cricketers to The
        Mermaid and The Black Hen.
      </p>
      <p>
        It describes itself as &quot;cosy, affordable, independent, and driven
        by community values&quot;, and fills its week with DJ sets, a monthly
        chess club, food pop-ups and magazine launches. Film clubs are part of
        that mix, taking over the pub for screenings of favourite films.
      </p>
    </section>
  );
}

export const seoDescription = "independent Irish pub in Lower Clapton";
export const seoHighlights = "film club screenings in a Clapton pub";

export default VenueBlurb;

import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Animation in Love is a year-long curatorial series at{" "}
        <Link href="/venues/the-barbican">the Barbican</Link>, running from
        February to October 2026. Rather than focusing on animation as a
        technique, the series uses love, longing, and human connection as its
        lens — drawing together animated films from across the world that find
        new ways to explore how we feel for one another. The result is a
        programme that spans continents, decades, and styles, united by
        emotional rather than formal concerns.
      </p>
      <p>
        Expect a mix of features, shorts programmes, and rare screenings from
        international and studio animation, selected for their emotional depth
        and visual inventiveness. It&apos;s a series for anyone who believes
        animation can go places live action can&apos;t — and that love, in all
        its forms, is worth looking at carefully.
      </p>
    </section>
  );
}

export const seoDescription =
  "Barbican year-long animation series exploring love and connection through world cinema";
export const seoHighlights =
  "international animation, features and shorts exploring love and longing";

export default FestivalBlurb;

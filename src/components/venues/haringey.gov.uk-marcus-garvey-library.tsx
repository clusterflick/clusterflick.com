import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Marcus Garvey Library sits inside the Tottenham Green Leisure Centre on
        Philip Lane, in <Link href="/london-cinemas/haringey/">Haringey</Link>,
        and is named after the civil rights activist. Its foundation stone was
        laid in 1987 by Garvey&apos;s son, and the library keeps his sculpted
        bust, portraits and &quot;an extensive collection of Marcus
        Garvey&apos;s literary works written by him and others&quot;.
      </p>
      <p>
        As well as books, DVDs, computers and meeting rooms for hire, it runs
        regular events for adults and children, and film showings are part of
        that free library programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "public library in Tottenham named after Marcus Garvey";
export const seoHighlights = "free film showings at Tottenham Green";

export default VenueBlurb;

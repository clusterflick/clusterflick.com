import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Coven is a queer cultural space on Old Compton Street in Soho,{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, where
        music, art, nightlife and community meet. It started out in Hackney in
        2025 before moving to Soho, and describes itself as &quot;building a new
        kind of queer venue: part nightclub, part performance space, part
        community hub, and entirely rooted in connection, experimentation and
        joy.&quot;
      </p>
      <p>
        Its programme is mostly clubbing, open decks, performance and themed
        parties. Screenings come from outside promoters, who put on film nights
        of their own here.
      </p>
    </section>
  );
}

export const seoDescription = "queer nightclub and performance space in Soho";
export const seoHighlights =
  "promoter-run film nights, clubbing and performance";

export default VenueBlurb;

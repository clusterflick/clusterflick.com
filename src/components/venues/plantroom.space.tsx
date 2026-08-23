import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Algha&apos;s Plantroom describes itself as &quot;just another cultural
        space&quot;. It sits on the second floor of Algha Works on Smeed Road,
        on Fish Island in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>, over
        the water from Hackney Wick.
      </p>
      <p>
        Blackney Wick Film Club screens there — a POC-oriented night, welcoming
        allies, set up out of a need for more sober spaces for its community to
        meet outside the club. It builds each edition around a theme, with sound
        systems and music either side of the films.
      </p>
    </section>
  );
}

export const seoDescription = "cultural space in Algha Works on Fish Island";
export const seoHighlights = "themed film club nights with sound systems";

export default VenueBlurb;

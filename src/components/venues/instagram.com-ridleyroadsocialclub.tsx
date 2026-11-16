import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Ridley Road Social Club is a first-floor café at the end of Ridley Road
        Market in Dalston, <Link href="/london-cinemas/hackney/">Hackney</Link>.
        It describes itself as &quot;more than just a café — it&apos;s a
        community hub where food, music, and art come together&quot;, serving
        daily dishes through the week and a Sunday roast with vegetarian
        options.
      </p>
      <p>
        The floor is shared with Hidden Sounds, a vinyl shop, and with artist
        studios, and the room has played host to exhibitions, performances and
        live music. The café doesn&apos;t programme films itself: screenings
        there are put on by outside organisers who use the space in the
        evenings.
      </p>
    </section>
  );
}

export const seoDescription =
  "Dalston café, vinyl shop and studios above Ridley Road Market";
export const seoHighlights = "film club screenings in a community café";

export default VenueBlurb;

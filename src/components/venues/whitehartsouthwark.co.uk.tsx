import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The White Hart is a pub on Great Suffolk Street in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, which calls
        itself &quot;long-established as one of the finest pubs in
        Southwark&quot;, pairing its 18th-century heritage with sofas, board
        games and big-screen sport, and a semi-private snug downstairs.
      </p>
      <p>
        Upstairs is the Elk Room, a dining room for around 40 kitted out with a
        large projector screen, projector and music system. That set-up lets it
        double as a screening room, and film nights here come from those who
        book it to show one.
      </p>
    </section>
  );
}

export const seoDescription =
  "long-established Great Suffolk Street pub in Southwark";
export const seoHighlights = "film nights in the upstairs Elk Room";

export default VenueBlurb;

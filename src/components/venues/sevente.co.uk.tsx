import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Sevente calls itself &quot;a neighbourhood bar and cultural space on
        Hackney Road&quot;, and has been at number 283, in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, since Emilio and
        Christopher opened it in 2023. It is a coffee bar by day and a cocktail
        and wine bar by night, in a room it describes as &quot;modern chic with
        nods to 70&apos;s Italia&quot;: a Togo sofa, a hand-built curved cement
        bar, and a projector screen across the back wall.
      </p>
      <p>
        Its pitch is &quot;come for a drink, stay for the community&quot;, and
        events run near-daily, from spoken word to Mario Kart and Uno nights.
        Film is part of that mix: the Sevente Ciné Club puts films up on that
        screen, with the bar open alongside.
      </p>
    </section>
  );
}

export const seoDescription =
  "Hackney Road neighbourhood bar and cultural space";
export const seoHighlights =
  "Sevente Ciné Club film nights and community events";

export default VenueBlurb;

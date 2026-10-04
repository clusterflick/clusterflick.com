import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Town House is Kingston University&apos;s landmark building on Penrhyn
        Road, in{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>.
        Designed by Grafton Architects, it opened in 2020 and won the 2021 RIBA
        Stirling Prize, the first university building to do so, followed by the
        EU&apos;s Mies van der Rohe Award.
      </p>
      <p>
        It provides &quot;performance, learning, exhibition and community
        spaces&quot;: the university library, dance studios, a studio theatre, a
        covered courtyard and a rooftop garden. Screenings here are events held
        in those spaces.
      </p>
    </section>
  );
}

export const seoDescription =
  "Kingston University's Stirling Prize-winning Town House";
export const seoHighlights = "public screenings in a landmark building";

export default VenueBlurb;

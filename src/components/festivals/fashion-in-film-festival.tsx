import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Fashion in Film Festival &ldquo;looks at cinema through the lens of
        fashion, and the other way round&rdquo;. Co-founded by Marketa Uhlirova
        and Christel Tsilibaris, it first ran in London in 2006, and each of its
        curated seasons explores a new aspect of where fashion and the moving
        image meet, alongside its exhibitions, publications and research.
      </p>
      <p>
        Its 20th-anniversary edition, The Party and the Guests, runs from 28
        November to 6 December 2026, with screenings at{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>, which also hosted
        its early editions. The programme ranges from pre-cinema and early film
        to Top Ten Designers in Paris, a Super 8 record of the 1979 Paris shows,
        and William Klein&rsquo;s Who Are You, Polly Maggoo?, introduced by the
        founders and followed by a panel.
      </p>
    </section>
  );
}

export const seoDescription =
  "a festival that looks at cinema through the lens of fashion, and the other way round, marking its 20th anniversary at Ciné Lumière";
export const seoHighlights =
  "early cinema, fashion documentaries and William Klein's Who Are You, Polly Maggoo?";

export default FestivalBlurb;

import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        London Breeze bills itself as &ldquo;a breath of fresh air on the
        international film festival circuit&rdquo;, and describes what it does
        as &ldquo;showcasing emerging filmmakers and award-winning films from
        the UK and around the world&rdquo;. It started life in 2016 as the
        Barnes Film Festival, took the London Breeze name as it spread across
        the city, and won BIFA qualifying status in 2021 &mdash; so its award
        winners become eligible for the British Independent Film Awards.
      </p>
      <p>
        The eleventh edition runs from 21 to 25 October 2026. It opens with a
        gala screening and reception at the{" "}
        <Link href="/venues/regent-street-cinema">Regent Street Cinema</Link>,
        spends its middle weekend at{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link> in
        Covent Garden, and closes with the awards at{" "}
        <Link href="/venues/riverside-studios">Riverside Studios</Link> in
        Hammersmith. The festival moves house from year to year rather than
        keeping a home screen: recent editions have also taken in the Olympic in
        Barnes, All is Joy in Soho, the Phoenix in East Finchley and the Cinema
        in the Power Station at Battersea.
      </p>
      <p>
        A good part of the programme is not a screening at all. Industry
        roundtables, a festival marketplace and a networking session sit
        alongside the premieres, which is of a piece with a festival whose
        stated purpose is &ldquo;nurturing the next generation of filmmakers
        &ndash; striving to engage with communities and young people to inspire
        creativity and confidence&rdquo;: there are competitions for filmmakers
        under 25, year-round panels on women and LGBTQ+ filmmakers, and work
        with community organisations. Alongside the London screenings, Breeze
        Online streams a curated selection of the programme for a fortnight, so
        the festival carries on after the cinemas have gone dark.
      </p>
    </section>
  );
}

export const seoDescription =
  "a BIFA-qualifying independent festival showcasing emerging filmmakers and award-winning films from the UK and around the world, running across London since 2016";
export const seoHighlights =
  "gala premieres with Q&As, industry roundtables and networking sessions, and a curated Breeze Online streaming programme";

export default FestivalBlurb;

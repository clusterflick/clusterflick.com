import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Fetish Film Festival is an annual celebration of fetish
        cinema, founded in 2016 by Venus Raven and Tainted Saint. The festival
        has established itself as a welcoming and unapologetic home for films
        that centre kink, BDSM, erotica, and sex work — genres too often
        overlooked or marginalised by mainstream festivals. It takes place at{" "}
        <Link href="/venues/the-arzner">The Arzner</Link> in Bermondsey.
      </p>
      <p>
        Beyond the screenings, the festival includes live art performances,
        filmmaker Q&amp;As, and an after-party, making it as much a community
        event as a film programme. Both established filmmakers and emerging
        voices in fetish and erotic cinema are featured, with an awards ceremony
        recognising outstanding work across the genre.
      </p>
    </section>
  );
}

export const seoDescription =
  "annual festival celebrating fetish, kink and erotic cinema at The Arzner, Bermondsey";
export const seoHighlights =
  "fetish and erotic cinema, live art, Q&As and filmmaker awards";

export default FestivalBlurb;

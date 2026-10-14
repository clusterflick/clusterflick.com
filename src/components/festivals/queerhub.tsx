import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        QUEERHUB is a London queer cinema platform — &ldquo;cinema, community,
        discovery&rdquo; — set up to make queer cinema easier to discover,
        discuss and experience together. Alongside a monthly film society, it
        runs a festival of new queer short films, which held its first edition
        in May 2026.
      </p>
      <p>
        The October 2026 edition runs over two evenings, 23 and 24 October, at
        the <Link href="/venues/london-film-school">London Film School</Link> in
        Covent Garden. Each night combines shared screenings with its own
        curated blocks, drawn from four themes — Desire Under Pressure, Queer
        Survival and Belonging, Born to Be Seen and Performative Intimacy —
        followed by a filmmaker Q&amp;A, with the evening carrying on afterwards
        as a space to meet the filmmakers and guests.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London queer film festival making queer cinema easier to discover, discuss and experience together";
export const seoHighlights =
  "programmes of new queer short films with filmmaker Q&As at the London Film School";

export default FestivalBlurb;

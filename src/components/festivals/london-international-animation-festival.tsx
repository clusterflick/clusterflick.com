import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London International Animation Festival (LIAF) is the UK&rsquo;s
        largest and longest-running animation festival. Founded in 2003, it
        screens the best of the world&rsquo;s independent animation, around 300
        films of every technique, style and genre, including many UK, European
        and world premieres.
      </p>
      <p>
        For ten days from late November to early December, the festival runs
        across London venues including{" "}
        <Link href="/venues/the-barbican">the Barbican</Link> and{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link>. The
        programme is built around its international competition, judged by an
        expert jury, alongside themed strands such as Late Night Bizarre and the
        Music Video Sessions, filmmaker retrospectives, screenings for children
        and an animation industry event of talks, Q&amp;As and workshops.
      </p>
    </section>
  );
}

export const seoDescription =
  "The UK's largest and longest-running animation festival, screening the best of the world's independent animation across London";
export const seoHighlights =
  "around 300 independent animated films, an international competition, Late Night Bizarre and an animation industry event";

export default FestivalBlurb;

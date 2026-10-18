import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        SIFFA is a London-based, non-profit independent international film
        festival, founded by Luba Balagova Kandour and the late filmmaker Mohy
        Quandour and running every November since 2016. Under the banner
        &ldquo;building cultural bridges through cinema&rdquo;, it brings
        independent features, documentaries and short films from around the
        world to UK audiences who would rarely get to see them otherwise.
      </p>
      <p>
        The 16th edition runs from 19 to 22 November 2026 at{" "}
        <Link href="/venues/vue-piccadilly">Vue Piccadilly</Link>, under the
        theme &ldquo;Fragile World, Unbroken Voices&rdquo;. Alongside the
        official selection there are masterclasses, filmmaker Q&amp;As and
        screenings of the Prokofiev Challenge winners, and the festival closes
        with the IRIDA awards, honouring films, filmmakers and lifetime
        achievement in cinema, literature and art.
      </p>
    </section>
  );
}

export const seoDescription =
  "an independent international film festival bringing world cinema to London audiences every November";
export const seoHighlights =
  "independent features, documentaries and shorts from around the world, with Q&As and the IRIDA awards, at Vue Piccadilly";

export default FestivalBlurb;

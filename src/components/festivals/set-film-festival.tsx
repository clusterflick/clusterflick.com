import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        SET Film Festival is an independent, grassroots festival of
        contemporary, artist and archival film, curated by Amina Ali, Ellie
        Dobbs and Verity Monroe. Founded in 2023, it has grown into an
        international platform for experimental practice, emerging voices and
        artists&rsquo; moving image that sits outside conventional exhibition
        and distribution, with a particular focus on trans-national, radical and
        Pan-African cinema.
      </p>
      <p>
        It is held each November at{" "}
        <Link href="/venues/set-social">SET Social</Link>, the arts and social
        club of the charity SET in Peckham, as a month of weekly film nights,
        each built around its own theme and many followed by a Q&amp;A with the
        filmmakers. The fourth edition, from 5 November to 5 December 2026,
        brings four short film nights, a feature-length screening, a free
        evening of archival film and performance, the festival&rsquo;s first
        online screening and its first awards night.
      </p>
    </section>
  );
}

export const seoDescription =
  "a grassroots festival of contemporary, artist and archival film in Peckham";
export const seoHighlights =
  "themed nights of short films with filmmaker Q&As, international features and an archival strand, every November";

export default FestivalBlurb;

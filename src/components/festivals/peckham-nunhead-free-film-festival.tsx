import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Peckham &amp; Nunhead Free Film Festival (PNFFF) is now in its 17th
        year of bringing completely free movie entertainment to communities
        across SE15, all thanks to the volunteers who organise and run it. It is
        part of Free Film Festivals, a network of volunteer-powered
        neighbourhood free film festivals.
      </p>
      <p>
        The 2026 edition runs from 4–13 September, opening with a pre-festival
        movie quiz at <Link href="/venues/the-ivy-house">The Ivy House</Link> on
        2 September. Screenings and workshops are spread across unique Peckham
        and Nunhead venues — <Link href="/venues/peckhamplex">Peckhamplex</Link>
        , <Link href="/venues/nunhead-cemetery">Nunhead Cemetery</Link>,{" "}
        <Link href="/venues/amp-studios">AMP Studios</Link>,{" "}
        <Link href="/venues/the-feminist-library">The Feminist Library</Link>{" "}
        and{" "}
        <Link href="/venues/mountview-academy-of-theatre-arts">Mountview</Link>{" "}
        among them — with something for everyone, whatever your age or taste in
        movies.
      </p>
    </section>
  );
}

export const seoDescription =
  "a volunteer-run festival in its 17th year of bringing completely free films to communities across SE15, part of the Free Film Festivals network";
export const seoHighlights =
  "free screenings, workshops and a short film night across Peckhamplex, Nunhead Cemetery, The Ivy House and AMP Studios";

export default FestivalBlurb;

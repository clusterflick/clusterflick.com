import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Streatham Free Film Festival returns in 2026 for its 11th edition,
        bringing three weeks of free, volunteer-powered cinema to venues across
        Streatham from 1–20 September. Its programme celebrates the creativity,
        diversity and community spirit that make Streatham such a special place,
        turning local spaces into pop-up cinemas for beloved classics,
        documentaries, family favourites and cult gems alike.
      </p>
      <p>
        This year&apos;s festival takes in three outdoor screenings in iconic
        local locations, live music and film events, a short film night
        showcasing London filmmakers, and special screenings in some of
        Streatham&apos;s most distinctive community venues — among them{" "}
        <Link href="/venues/streatham-library">Streatham Library</Link>,{" "}
        <Link href="/venues/the-british-home">The British Home</Link>,{" "}
        <Link href="/venues/the-woodfield-pavilion">
          The Woodfield Pavilion
        </Link>{" "}
        and{" "}
        <Link href="/venues/batch-and-co-coffee">Batch &amp; Co. Coffee</Link>.
        It is part of the Free Film Festivals network, a group of volunteer-run
        neighbourhood film festivals.
      </p>
    </section>
  );
}

export const seoDescription =
  "three weeks of free, volunteer-powered cinema across Streatham in its 11th edition, part of the Free Film Festivals network";
export const seoHighlights =
  "outdoor screenings, live music and film events and a London filmmakers' short film night across Streatham Library, The British Home and The Woodfield Pavilion";

export default FestivalBlurb;

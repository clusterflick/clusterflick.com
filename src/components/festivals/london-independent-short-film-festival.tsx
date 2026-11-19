import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Independent Short Film Festival champions director-led short
        films from around the world, bringing new voices and established talent
        together in the heart of the West End. It is held at{" "}
        <Link href="/venues/the-soho-screening-rooms">
          The Soho Screening Rooms
        </Link>{" "}
        on D&rsquo;Arblay Street.
      </p>
      <p>
        In the organisers&rsquo; words, its screenings and conversations connect
        filmmakers with engaged audiences and celebrate &ldquo;stories that stay
        with you long after the lights come up&rdquo;. A viewing panel picks
        five nominees in each of seventeen categories and a winner from each,
        and the festival builds to a single evening of those winners: two
        programmes of shorts on 23 November 2026, followed by an awards ceremony
        and prize giving that night.
      </p>
    </section>
  );
}

export const seoDescription =
  "a festival of director-led independent short films from around the world, in the heart of London's West End";
export const seoHighlights =
  "screenings of the winners in seventeen categories, followed by an awards ceremony on the same night";

export default FestivalBlurb;

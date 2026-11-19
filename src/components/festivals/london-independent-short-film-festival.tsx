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
        Every film submitted is watched by a viewing panel and graded RADA-style
        across six crafts &mdash; directing, cinematography, design, acting,
        music and sound, and editing &mdash; and every filmmaker receives their
        score and a short report. Five films in each of seventeen categories are
        nominated, one in each wins, and the winners are screened at the
        festival ahead of an awards ceremony that evening.
      </p>
    </section>
  );
}

export const seoDescription =
  "a festival of director-led independent short films from around the world, in the heart of London's West End";
export const seoHighlights =
  "screenings of the winners in seventeen categories, followed by an awards ceremony on the same night";

export default FestivalBlurb;

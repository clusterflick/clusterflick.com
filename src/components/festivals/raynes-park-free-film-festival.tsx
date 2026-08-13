import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Raynes Park Free Film Festival is an annual festival held in Raynes Park
        SW20 and the surrounding areas, where each year a volunteer-led team
        brings a week of new movies, classics, documentaries and short films for
        all ages. It is part of Free Film Festivals, a network of
        volunteer-powered neighbourhood free film festivals.
      </p>
      <p>
        The 2026 edition runs from 19–26 September, opening and closing at{" "}
        <Link href="/venues/st-matthews-church">St Matthew&apos;s Church</Link>{" "}
        and taking in pubs, community halls and local businesses across the
        neighbourhood in between.
      </p>
    </section>
  );
}

export const seoDescription =
  "a volunteer-led week of free new releases, classics, documentaries and shorts across Raynes Park SW20, part of the Free Film Festivals network";
export const seoHighlights =
  "free screenings for all ages in churches, pubs and community halls around Raynes Park";

export default FestivalBlurb;

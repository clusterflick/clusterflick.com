import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Blown Away Studios is a creative space on Luke Street in Shoreditch,{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, set up to host all
        sorts of creative work - a white-brick studio with plenty of natural
        light, a full kitchen and room for around 70 people standing.
      </p>
      <p>
        It is used for workshops, pop-ups, launch events, exhibitions,
        performances and photo and video shoots. Its screenings come from a film
        club that meets in the studio, showing arthouse classics to an audience
        gathered in the space.
      </p>
    </section>
  );
}

export const seoDescription = "Shoreditch creative studio";
export const seoHighlights = "film club screenings of arthouse classics";

export default VenueBlurb;

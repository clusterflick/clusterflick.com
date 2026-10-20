import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        MUBI FEST is the touring festival of MUBI, the film distributor,
        production house and streaming service, held in a different set of
        cities around the world each year. Its first UK edition was in
        Manchester in 2024, followed by Glasgow in 2025, and in 2026 it comes to
        London for the first time.
      </p>
      <p>
        MUBI FEST London is a three-day mini fest at{" "}
        <Link href="/venues/hackney-picturehouse">Hackney Picturehouse</Link>,
        running 13 to 15 November 2026. Its programme mixes previews of new
        films, several with Q&amp;As from their directors and casts, with
        anniversary screenings of Drive and The Handmaiden and events made with
        partners: a live recording of the Evolution of Horror podcast, a
        storytelling session and a queer short film showcase with Gay Times.
      </p>
    </section>
  );
}

export const seoDescription =
  "the touring festival of film distributor and streaming service MUBI, coming to London for the first time with three days at Hackney Picturehouse";
export const seoHighlights =
  "previews with filmmaker Q&As, anniversary screenings of Drive and The Handmaiden, and a live podcast recording";

export default FestivalBlurb;

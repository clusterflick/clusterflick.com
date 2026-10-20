import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        MUBI FEST is the film festival run by MUBI, the film distributor,
        production house and streaming service. Its first London edition is a
        three-day mini fest at{" "}
        <Link href="/venues/hackney-picturehouse">Hackney Picturehouse</Link>.
      </p>
      <p>
        The programme mixes previews of MUBI&apos;s new releases, many with
        filmmaker Q&amp;As, with anniversary screenings and events made with
        partners — a live podcast recording, storytelling and a queer short film
        showcase.
      </p>
    </section>
  );
}

export const seoDescription =
  "MUBI's own film festival: three days of previews, Q&As and special events at Hackney Picturehouse";
export const seoHighlights =
  "Previews with filmmaker Q&As, anniversary screenings and a live podcast";

export default FestivalBlurb;

import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Stockwell Park Community Centre on Aytoun Place is run by Stockwell Park
        Estate Community Trust, a registered charity working across Stockwell
        and North Brixton in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>. Alongside a
        community café, a foodbank, drop-in advice clinics and free activities
        for local children and young people, it offers &quot;a wide range of
        spaces for hire to suit every occasion and budget&quot; — anything from
        a one-to-one meeting to a hundred-delegate conference.
      </p>
      <p>
        Its MediaHub adds a refurbished studio and editing suite for filming and
        podcasting, along with rehearsal and performance space and a weekly
        Digital Media Skills Club. Film reaches the centre through visiting
        programmes that book the space rather than a schedule of its own.
      </p>
    </section>
  );
}

export const seoDescription =
  "charity-run community centre on the Stockwell Park Estate";
export const seoHighlights =
  "visiting film programmes and community screenings";

export default VenueBlurb;

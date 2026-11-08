import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Farr&apos;s Dalston is a bar and pub on Dalston Lane in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, named after
        Farr&apos;s School of Dancing, which taught in the building in the
        1930s. Before that the site had been &quot;a busy and popular
        cinema-of-old, The Dalston Picture Palace&quot;. Its Dance Bar still has
        a sprung floor, in use for swing nights and DJ sets.
      </p>
      <p>
        Film has found its way back downstairs, where the basement Projection
        Room has its own bar and is given over to screenings, bands, talks and
        private parties. Screenings there are put on by groups who hire the room
        for the night.
      </p>
    </section>
  );
}

export const seoDescription =
  "Dalston Lane bar in a former dance school and picture palace";
export const seoHighlights = "film nights in the basement Projection Room";

export default VenueBlurb;

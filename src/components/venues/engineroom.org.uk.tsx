import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St Francis at The Engine Room is an Anglican church and community centre
        on Lebus Street in Tottenham Hale, in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>. Opened in
        October 2017, it was the first new Anglican church in London for over
        forty years, modelled on the medieval idea of the church as a
        village&apos;s hub.
      </p>
      <p>
        With a café and nursery, the building was &quot;built to be used every
        day&quot;, by youth clubs, art and walking groups, and for Friday
        prayers from Tottenham Mosque. Its rooms can be hired, and the church
        puts on screenings with local campaign groups.
      </p>
    </section>
  );
}

export const seoDescription =
  "Tottenham Hale church and community centre, opened in 2017";
export const seoHighlights = "screenings with local groups";

export default VenueBlurb;

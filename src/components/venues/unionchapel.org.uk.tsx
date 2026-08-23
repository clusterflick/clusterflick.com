import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Union Chapel on Compton Terrace in{" "}
        <Link href="/london-cinemas/islington/">Islington</Link> is an
        architectural treasure that is at once a working church, an
        award-winning venue and the home of a unique organ. It is an inclusive
        church whose congregation works on racial, social, economic and climate
        justice, and it also houses The Margins Project, which supports people
        facing homelessness and crisis in London.
      </p>
      <p>
        The venue programme covers gigs, comedy, debates and film screenings,
        with festivals such as the Ocean Film Festival and the Banff Mountain
        Film Festival stopping there on tour. Profits from the shows, the bar
        and space hire go back into the charitable work and into keeping the
        building in community use.
      </p>
    </section>
  );
}

export const seoDescription =
  "working church and award-winning music venue in Islington";
export const seoHighlights = "touring film festivals, gigs and comedy";

export default VenueBlurb;

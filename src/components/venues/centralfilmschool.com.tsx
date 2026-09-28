import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Central Film School is a specialist film institution on Landor Road in
        Stockwell, <Link href="/london-cinemas/lambeth/">Lambeth</Link>, that
        has trained students for the screen industries since 2008. It offers
        undergraduate degrees in filmmaking, screenwriting, acting for screen
        and virtual production &amp; VFX, and describes itself as
        &quot;dedicated to amplifying underrepresented voices&quot;.
      </p>
      <p>
        The school moved into its current campus in 2022. The building was
        &quot;once a 19th-century music hall and later the home of the Italia
        Conti performing arts school&quot;, and now houses production and
        editing suites and motion capture facilities. The school also runs
        regular industry events and guest lectures.
      </p>
    </section>
  );
}

export const seoDescription =
  "specialist film school in a former Stockwell music hall";
export const seoHighlights = "screenings and industry events at a film school";

export default VenueBlurb;

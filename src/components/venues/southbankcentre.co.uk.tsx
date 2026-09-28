import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Southbank Centre is the largest arts centre in the UK, on the banks
        of the Thames in <Link href="/london-cinemas/lambeth/">Lambeth</Link>,
        and has been at the heart of London&apos;s cultural life since the 1951
        Festival of Britain. It puts on thousands of events every year across
        its halls and galleries.
      </p>
      <p>
        Its screenings are held in the Royal Festival Hall, whose 2,700-capacity
        auditorium opened as part of that festival and &quot;fast became one of
        the world&apos;s landmark performance venues&quot;. Since 1983 the Grade
        I listed building&apos;s foyers have been open daily and free to all,
        and the hall hosts film festival galas.
      </p>
    </section>
  );
}

export const seoDescription = "UK's largest arts centre on the South Bank";
export const seoHighlights = "film festival galas in the Royal Festival Hall";

export default VenueBlurb;

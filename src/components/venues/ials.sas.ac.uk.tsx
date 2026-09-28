import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Institute of Advanced Legal Studies, founded in 1947 and part of the
        University of London&apos;s School of Advanced Study, is a national
        centre for legal research. Since 1976 it has occupied eight floors of
        Charles Clore House on Russell Square in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>, part of Sir Denys
        Lasdun&apos;s Grade II* listed Brutalist Bedford Way complex.
      </p>
      <p>
        Its library holds over 300,000 books, journals and reports for
        researchers across the UK, and its hub for Law and the Humanities brings
        in artists as well as academics. Its public screenings, including
        festival programmes of international film, grow out of that wider
        cultural work.
      </p>
    </section>
  );
}

export const seoDescription = "legal research institute on Russell Square";
export const seoHighlights = "festival screenings of international film";

export default VenueBlurb;

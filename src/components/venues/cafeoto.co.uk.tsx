import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Cafe OTO is on Ashwin Street in Dalston, in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, and describes
        itself as &quot;a home for creative new music that exists outside of the
        mainstream&quot;, with &quot;adventurous live music seven nights a
        week&quot;. The concert programme is run by OTOProjects, a
        not-for-profit community interest company. By day it&apos;s a cafe and
        shop selling records, tapes and books, including releases on its own
        OTOROKU label.
      </p>
      <p>
        Film is an occasional part of that evening programme rather than a
        regular strand. Screenings are often paired with a live set, and come
        from OTO itself or from the promoters who put on nights there.
      </p>
    </section>
  );
}

export const seoDescription =
  "Dalston venue for experimental and improvised music";
export const seoHighlights = "occasional film screenings with live music";

export default VenueBlurb;

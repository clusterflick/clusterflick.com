import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Hundred Years Gallery is &quot;a dynamic art space situated in
        Hoxton&quot;, on Pearson Street in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, supporting
        &quot;experimental and innovative art&quot; with an emphasis on
        &quot;radical ideas and young or unrepresented artists&quot;. It is run
        as a not-for-profit Community Interest Company.
      </p>
      <p>
        Weekly concerts of new composed, improvised and experimental music share
        the space with its exhibitions, and it welcomes proposals from outside
        groups to put on their own events. Film arrives that way too, with
        programmes of short and artists&apos; film screened by the groups using
        the gallery.
      </p>
    </section>
  );
}

export const seoDescription = "experimental art and music space in Hoxton";
export const seoHighlights = "short and artists' film programmes";

export default VenueBlurb;

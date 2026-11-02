import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Chats Palace is an arts centre on Brooksby&apos;s Walk in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, in a Grade II
        listed former library that Andrew Carnegie gave to the borough. Local
        residents took the building over in 1976 to keep it in community hands,
        and the name nods to Joan Littlewood&apos;s People&apos;s Palace and the
        old Palace cinema on Chatsworth Road.
      </p>
      <p>
        It calls itself &quot;a home for radical creativity and collective
        action&quot;, with a programme of performance, music, family events and
        exhibitions. Screenings are put on by outside promoters and artists, who
        use its theatre and bar for the evening.
      </p>
    </section>
  );
}

export const seoDescription =
  "Homerton arts centre in a Grade II listed former library";
export const seoHighlights =
  "promoter-run screenings, performance and exhibitions";

export default VenueBlurb;

import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Red Door Studios calls itself &quot;an artist run, community focused
        space&quot;, behind High Street South in East Ham, in{" "}
        <Link href="/london-cinemas/newham/">Newham</Link>. It has offered
        affordable studios since 2011, in a building from around 1893 that was
        once part of a bakery and later a laboratory glassware factory.
      </p>
      <p>
        Its aims are to bring forward less-heard voices and to let communities
        be led by the people in them, and the artists here work in animation,
        illustration and theatre set design. It also collaborates with people
        from outside the studios, and screenings are brought here by local
        groups.
      </p>
    </section>
  );
}

export const seoDescription = "artist-run studios in a former East Ham bakery";
export const seoHighlights = "screenings by local groups, exhibitions and gigs";

export default VenueBlurb;

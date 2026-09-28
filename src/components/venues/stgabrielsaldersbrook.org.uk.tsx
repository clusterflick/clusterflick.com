import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St Gabriel&apos;s is the Church of England parish church of the
        Aldersbrook estate in Wanstead,{" "}
        <Link href="/london-cinemas/redbridge/">Redbridge</Link>, on the corner
        of Park Road and Aldersbrook Road. It describes itself as &quot;a church
        in the more catholic tradition&quot;, with more ritual than many Church
        of England churches.
      </p>
      <p>
        Its mission is to bring &quot;wholeness, hope and joy in the communities
        where we live and work&quot;, and the church opens to its neighbours
        beyond Sunday worship, including seasonal screenings accompanied by live
        music.
      </p>
    </section>
  );
}

export const seoDescription = "parish church in Aldersbrook, Wanstead";
export const seoHighlights = "seasonal screenings with live music";

export default VenueBlurb;

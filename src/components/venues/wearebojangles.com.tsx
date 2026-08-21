import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Bojangles Brasserie is a lounge bar and events venue in Chingford Mount,{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>,
        describing itself as &quot;the ideal venue for over 30s who like to have
        a good time&quot;. It has a stage, a full sound and lighting rig, a
        kitchen and a large outdoor terrace, and takes both private bookings and
        its own public events.
      </p>
      <p>
        Among those is a regular film screening series, showing classics and
        modern favourites on the big screen at Bojangles.
      </p>
    </section>
  );
}

export const seoDescription = "Lounge bar and events venue in South Chingford";
export const seoHighlights = "big-screen film screenings and live events";

export default VenueBlurb;

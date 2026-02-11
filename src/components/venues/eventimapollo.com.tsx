import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Eventim Apollo is a landmark concert and entertainment venue on
        Queen Caroline Street in{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">Hammersmith</Link>,
        West London. Originally opened in 1932 as the Gaumont Palace cinema, the
        Art Deco building went on to become one of London&apos;s most famous
        live music venues—known over the years as the Hammersmith Odeon, the
        Carling Apollo, and the HMV Hammersmith Apollo. While primarily a live
        music and events venue today, the Apollo occasionally hosts film
        screenings and cinema events, taking advantage of its grand auditorium
        and large screen.
      </p>
    </section>
  );
}

export const seoDescription = "historic Hammersmith Art Deco concert hall";
export const seoHighlights =
  "live event screenings, concerts and classic film revivals";

export default VenueBlurb;

import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Peckham Oasis Gallery is a multi-disciplinary art and event space in the
        railway arches beneath Peckham Rye station, in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>. It is run by
        Hifer Studios, a charity that turns vacant urban infrastructure into
        accessible cultural spaces, and sets out to be a platform for emerging,
        grassroots and experimental artists.
      </p>
      <p>
        Its rotating exhibitions run from fine art to multimedia work, often
        with independent curators, alongside live jazz, street food and a Sunday
        art market where local makers sell prints, ceramics and handmade goods.
        The raw, open-plan space is also hired out to artists and guest curators
        for pop-ups, and community cinema screenings are part of that mix,
        announced through the gallery&apos;s Instagram.
      </p>
    </section>
  );
}

export const seoDescription =
  "Charity-run art and event space under Peckham Rye station";
export const seoHighlights =
  "exhibitions, live jazz and community cinema screenings";

export default VenueBlurb;

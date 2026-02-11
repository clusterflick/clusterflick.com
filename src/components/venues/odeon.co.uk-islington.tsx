import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        ODEON Luxe &amp; Dine Islington is part of the ODEON cinema chain, one
        of the UK&apos;s oldest and largest cinema operators. Located on Esther
        Anne Place in <Link href="/london-cinemas/islington/">Islington</Link>,
        North London, this venue combines ODEON&apos;s Luxe premium
        experience—with recliner seating and enhanced comfort—alongside an
        in-seat dining concept, where a menu of freshly prepared food and drinks
        is served directly to your seat during the film. The venue has multiple
        screens with digital projection and modern sound systems, showing a wide
        range of mainstream blockbusters, new releases, and popular films.
      </p>
    </section>
  );
}

export const seoDescription = "premium Luxe and Dine cinema in Islington";
export const seoHighlights =
  "blockbusters, in-seat dining and recliner seating";

export default VenueBlurb;

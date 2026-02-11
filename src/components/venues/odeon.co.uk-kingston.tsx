import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        ODEON Kingston is part of the ODEON cinema chain, one of the UK&apos;s
        oldest and largest cinema operators. Located on Clarence Street in{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">
          Kingston upon Thames
        </Link>
        , Southwest London, the venue features multiple screens with digital
        projection and modern sound systems, showing a wide range of mainstream
        blockbusters, new releases, and popular films. As a standard ODEON
        location, it offers online booking and concession stands serving the
        usual cinema snacks and drinks.
      </p>
    </section>
  );
}

export const seoDescription = "multiplex in Kingston upon Thames";
export const seoHighlights = "blockbusters, new releases and popular films";

export default VenueBlurb;

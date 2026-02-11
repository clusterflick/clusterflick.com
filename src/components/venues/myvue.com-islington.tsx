import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Vue Islington is part of the Vue cinema chain, one of the UK&apos;s
        largest cinema operators. Located at Angel Central on Parkfield Street
        in <Link href="/london-cinemas/islington/">Islington</Link>, north
        London, the venue features multiple screens with digital projection and
        modern sound systems, showing a wide range of mainstream blockbusters,
        new releases, and popular films. As a standard Vue location, it offers
        online booking, regular ticket deals, and concession stands serving the
        usual cinema snacks and drinks.
      </p>
    </section>
  );
}

export const seoDescription = "multiplex at Angel Central, Islington";
export const seoHighlights = "blockbusters, new releases and mainstream films";

export default VenueBlurb;

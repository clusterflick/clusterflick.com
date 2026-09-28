import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Minet Library is on Knatchbull Road in Myatts Fields, close to
        Loughborough Junction in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>, and sits alongside
        Lambeth Archives. Its lending stock runs from books and audiobooks to
        language courses and books in other languages.
      </p>
      <p>
        It runs a weekly rhyme and story time, an adult reading group and
        seasonal events through the year, offers rooms for hire, and is a Safe
        Haven space for anyone feeling unsafe. Its film screenings, followed by
        discussion, are part of that community programme.
      </p>
    </section>
  );
}

export const seoDescription = "Lambeth library in Myatts Fields";
export const seoHighlights = "community screenings followed by discussion";

export default VenueBlurb;

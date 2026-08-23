import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Morland Community Hall is a council-run hall on the Morland Estate off
        Gayhurst Road in <Link href="/london-cinemas/hackney/">Hackney</Link>, a
        short walk from London Fields. Its main hall seats up to 100 and sits on
        the first floor with lift access, and it is booked for everything from
        training and community meetings to dance classes, amateur dramatics and
        parties.
      </p>
      <p>
        The Morland Estate Film Club screens films there for the estate and the
        surrounding neighbourhood.
      </p>
    </section>
  );
}

export const seoDescription = "community hall on Hackney's Morland Estate";
export const seoHighlights = "estate film club and community screenings";

export default VenueBlurb;

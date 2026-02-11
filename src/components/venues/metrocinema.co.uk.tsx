import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Metro Cinema is an independent cinema on Station Road in{" "}
        <Link href="/london-cinemas/harrow/">Harrow</Link>, Northwest London.
        The venue screens a programme of mainstream new releases alongside
        Bollywood and South Asian films, reflecting the diverse local community.
        As an independently operated cinema, it provides an affordable local
        alternative to the larger multiplex chains in the Harrow area.
      </p>
    </section>
  );
}

export const seoDescription = "independent cinema in Harrow";
export const seoHighlights = "new releases, Bollywood and South Asian films";

export default VenueBlurb;

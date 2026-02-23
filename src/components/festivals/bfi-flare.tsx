import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        BFI Flare is the UK&apos;s longest-running and most celebrated LGBTQIA+
        film festival, presented annually by the British Film Institute at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>. First staged in
        1986 as the London Lesbian &amp; Gay Film Festival, it has grown into
        one of the world&apos;s most important showcases for queer cinema —
        featuring premieres, archive restorations, shorts programmes, and
        filmmaker conversations across almost four decades.
      </p>
      <p>
        The festival champions bold, diverse storytelling from LGBTQIA+
        filmmakers around the globe, spanning narrative features, documentaries,
        experimental work, and episodic content. Beyond the screenings, BFI
        Flare offers industry events, panel discussions, and social gatherings
        that make it as much a community celebration as a film programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "the UK's longest-running LGBTQIA+ film festival, presented by the BFI at Southbank";
export const seoHighlights =
  "queer cinema premieres, archive restorations, shorts and filmmaker Q&As";

export default FestivalBlurb;

import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        French Film Festival UK is the UK&apos;s only festival dedicated to
        French and francophone cinema. Co-founded by its director Richard Mowe,
        it tours more than 40 venues across the country each autumn, and its
        34th edition runs from 4 November to 9 December 2026.
      </p>
      <p>
        The programme brings premieres, new talent and restored classics,
        alongside encounters with filmmakers and screenings for schools. This
        year it comes to{" "}
        <Link href="/venues/the-gate-picturehouse">The Gate Picturehouse</Link>{" "}
        in London. It is a separate festival from the French Film Festival
        London at Ciné Lumière.
      </p>
    </section>
  );
}

export const seoDescription =
  "The UK's only festival dedicated to French and francophone cinema, touring more than 40 venues each autumn";
export const seoHighlights =
  "Premieres, new talent, restored classics and filmmaker encounters";

export default FestivalBlurb;

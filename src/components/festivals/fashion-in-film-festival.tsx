import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Fashion in Film Festival looks at cinema through the lens of
        fashion, and the other way round. Founded in London by Marketa Uhlirova
        and Christel Tsilibaris, each of its curated seasons explores a new part
        of that intersection — the images, stories, materials and makers where
        clothing and the moving image meet.
      </p>
      <p>
        Its 2026 edition marks the festival&apos;s 20th anniversary, with
        screenings at <Link href="/venues/cine-lumiere">Ciné Lumière</Link>,
        which also hosted its first editions. The programme ranges from
        pre-cinema and early film to William Klein&apos;s{" "}
        <em>Who Are You, Polly Maggoo?</em>, introduced by the founders and
        followed by a panel.
      </p>
    </section>
  );
}

export const seoDescription =
  "Cinema seen through the lens of fashion: curated seasons of early cinema, documentaries and features exploring dress on screen";
export const seoHighlights =
  "Curated programmes, introductions by the festival's founders and panel discussions";

export default FestivalBlurb;

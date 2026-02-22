import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Judgement Hall Festival is a three-day site-specific festival of
        experimental performance, bringing together sound art, live movement,
        and cinema in unconventional settings. Returning in April 2026, the
        festival is built around newly commissioned work and the kind of
        programming that doesn&apos;t fit neatly anywhere else — challenging,
        atmospheric, and deeply attentive to the relationship between art and
        space.
      </p>
      <p>
        The 2026 edition culminates at the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link> in Dalston with a live
        score to Sergei Parajanov&apos;s 1984 film{" "}
        <em>The Legend of Suram Fortress</em>, newly commissioned for the
        occasion. It&apos;s a fitting centrepiece for a festival that treats
        cinema not as passive entertainment but as a place where image, sound,
        and presence collide.
      </p>
    </section>
  );
}

export const seoDescription =
  "site-specific festival of experimental performance, cinema and live scores";
export const seoHighlights =
  "sound art, experimental cinema and newly commissioned live scores";

export default FestivalBlurb;

import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Siren Screen is a London community film club celebrating &quot;myths in
        motion&quot;, founded by film programmer Georgia Hunter. It screens
        fantastical, esoteric and cult cinema from around the world, films that
        explore &quot;the mystical, mythic, folkloric, and cultural canons
        embedded in societies worldwide&quot;, and calls itself the home of
        &quot;whimsical witches, dangerous dames, and two-bit court
        jesters&quot;.
      </p>
      <p>
        Its nights move between venues, among them{" "}
        <Link href="/venues/the-cinema-museum">The Cinema Museum</Link>,{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link> and{" "}
        <Link href="/venues/coldharbour-blue">Coldharbour Blue</Link>, sometimes
        on 16mm, and some are programmed with the Leeds film club Glue Gun.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London community film club screening fantastical, esoteric and cult cinema that celebrates myths in motion";

export default FilmClubBlurb;

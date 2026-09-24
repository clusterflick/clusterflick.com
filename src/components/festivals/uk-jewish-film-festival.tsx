import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The UK Jewish Film Festival, run by the charity UK Jewish Film since
        1997, is one of the largest Jewish film festivals in the world and a
        BAFTA-qualifying festival for short films. Each November it brings
        features, documentaries and shorts from across the globe exploring
        Jewish life, history and identity — from Holocaust memory and Israeli
        cinema to comedy, music and family drama.
      </p>
      <p>
        The 2026 edition is its 30th, running across London from 5 to 15
        November at venues including{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>,{" "}
        <Link href="/venues/curzon-mayfair">Curzon Mayfair</Link>,{" "}
        <Link href="/venues/picturehouse-central">Picturehouse Central</Link>,
        the <Link href="/venues/phoenix-cinema">Phoenix Cinema</Link> and{" "}
        <Link href="/venues/jw3">JW3</Link>, with galas, UK premieres, filmmaker
        Q&amp;As and world premieres of the Pears and Dangoor short film fund
        winners.
      </p>
    </section>
  );
}

export const seoDescription =
  "One of the world's largest Jewish film festivals, screening features, documentaries and shorts across London each November";
export const seoHighlights =
  "30th edition galas, UK premieres, filmmaker Q&As and short film fund premieres";

export default FestivalBlurb;

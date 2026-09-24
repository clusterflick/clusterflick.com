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
        The festival opens in London, spread across cinemas throughout the city
        — regularly including the{" "}
        <Link href="/venues/phoenix-cinema">Phoenix Cinema</Link> and{" "}
        <Link href="/venues/jw3">JW3</Link> — before touring Manchester and the
        rest of the UK and running online. Its programme mixes galas, UK
        premieres and filmmaker Q&amp;As with premieres from its own short film
        funds.
      </p>
    </section>
  );
}

export const seoDescription =
  "One of the world's largest Jewish film festivals, screening features, documentaries and shorts across London each November";
export const seoHighlights =
  "Galas, UK premieres, filmmaker Q&As and short film fund premieres";

export default FestivalBlurb;

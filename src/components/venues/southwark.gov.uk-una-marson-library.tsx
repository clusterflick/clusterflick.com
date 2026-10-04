import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Una Marson Library on Thurlow Street opened in 2024 as part of the
        Aylesbury estate&apos;s redevelopment in Walworth,{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>. It is named
        after &quot;the Jamaican-born poet and playwright Una Marson, who lived
        in Southwark when she first came to the UK in the 1930s&quot; and became
        the BBC&apos;s first Black woman programme maker.
      </p>
      <p>
        It has study spaces, rooms for hire and Spanish and Portuguese
        collections, and its screenings come through the council&apos;s free
        events programme, Southwark Presents.
      </p>
    </section>
  );
}

export const seoDescription =
  "new public library in Walworth named after Una Marson";
export const seoHighlights = "free library screenings from Southwark Presents";

export default VenueBlurb;

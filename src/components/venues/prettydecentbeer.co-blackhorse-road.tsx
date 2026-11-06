import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Pretty Decent&apos;s brewhouse and biggest taproom is on a business park
        off Blackhorse Lane in{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>,
        &quot;right in the heart of the Blackhorse Beer Mile&quot;. It&apos;s a
        spacious warehouse of colourful murals, fairy lights and communal
        tables, with 20 taps pouring beer brewed just metres away.
      </p>
      <p>
        The brewery runs its own free film night here, Sunday Movie Club. Each
        of its taprooms shows a different film, so what&apos;s on the screen at
        Blackhorse Road isn&apos;t what the others are showing.
      </p>
    </section>
  );
}

export const seoDescription = "brewery taproom on the Blackhorse Beer Mile";
export const seoHighlights = "free Sunday Movie Club";

export default VenueBlurb;

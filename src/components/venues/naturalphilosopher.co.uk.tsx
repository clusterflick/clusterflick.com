import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Natural Philosopher is a hidden cocktail bar and whisky bunker on
        Hackney Road,{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>,
        reached by stepping through The MacSmiths repair shop. It calls itself
        &quot;a modern speakeasy cocktail bar for the curious&quot;, with low
        lights and a list of 20 whiskies that changes as each bottle runs dry.
      </p>
      <p>
        Opened in 2015 and holding around 48 people, it runs whisky tastings and
        themed nights alongside its menus. Its screenings are cult film nights,
        with guest curators bringing seasons of horror and slasher films to the
        bar.
      </p>
    </section>
  );
}

export const seoDescription =
  "hidden cocktail bar and whisky bunker on Hackney Road";
export const seoHighlights = "cult horror film nights in a speakeasy";

export default VenueBlurb;

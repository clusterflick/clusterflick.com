import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Greener and Cleaner is a registered charity working to build greener,
        stronger and more connected communities. Its Hub sits on the upper mall
        of The Glades shopping centre in{" "}
        <Link href="/london-cinemas/bromley/">Bromley</Link>, and since opening
        in 2022 has welcomed more than 20,000 residents through the door.
      </p>
      <p>
        The Hub runs hundreds of activities a year — workshops and talks,
        practical advice on energy bills and carbon footprints from volunteers,
        and the Bromley Library of Things to borrow equipment from. Among them
        is an Environmental Film Cafe, screening films on the climate and the
        natural world.
      </p>
    </section>
  );
}

export const seoDescription =
  "community sustainability hub in The Glades, Bromley";
export const seoHighlights = "environmental film cafe, workshops and talks";

export default VenueBlurb;

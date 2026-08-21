import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Upminster Windmill is a Grade II* listed smock mill built in 1803 for
        the local farmer James Nokes, and is widely considered one of the finest
        remaining English smock mills. It is looked after by the Friends of
        Upminster Windmill, a volunteer charity who conserve the site and
        operate the working mill on behalf of the London Borough of{" "}
        <Link href="/london-cinemas/havering/">Havering</Link>, alongside a
        visitor centre and an award-winning garden.
      </p>
      <p>
        Beyond the mill tours, open days and family activities, the grounds have
        been given over to free open-air cinema, staged by Havering Council on a
        large LED screen beneath the mill.
      </p>
    </section>
  );
}

export const seoDescription =
  "Restored 1803 smock mill and heritage site in Upminster";
export const seoHighlights = "free open-air cinema, mill tours and open days";

export default VenueBlurb;

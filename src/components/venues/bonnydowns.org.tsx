import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Bonny Downs Community Association is a charity at The Well Community
        Centre on Vicarage Lane in East Ham, in{" "}
        <Link href="/london-cinemas/newham/">Newham</Link>. Working in the
        borough since 1998, it describes its aim as &quot;changing lives and
        transforming our community&quot;, helping local people connect, get
        through crises and look after their wellbeing.
      </p>
      <p>
        The Well has a multi-purpose main hall holding up to 120, with a TV and
        sound system, along with training rooms and a community café. Those
        rooms are open for hire, and screenings here are brought in by local
        groups.
      </p>
    </section>
  );
}

export const seoDescription =
  "East Ham community charity at The Well Community Centre";
export const seoHighlights = "screenings by local groups";

export default VenueBlurb;

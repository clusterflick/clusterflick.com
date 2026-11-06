import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Walworth Living Room is in All Saints Hall on Surrey Square, in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, a former
        church hall brought back into use by Pembroke House, a charity working
        in Walworth since 1885. It describes itself as &quot;a welcoming
        space–free and open to everyone–created by local residents for local
        residents&quot;.
      </p>
      <p>
        Neighbours come here for social and creative activities for all ages,
        workshops on local issues and community meals. Screenings are put on by
        Pembroke House together with local groups.
      </p>
    </section>
  );
}

export const seoDescription =
  "free community space in All Saints Hall, Walworth";
export const seoHighlights = "neighbourhood screenings by local groups";

export default VenueBlurb;

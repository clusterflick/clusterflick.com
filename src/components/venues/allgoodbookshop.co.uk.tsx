import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The All Good Bookshop is an independent bookshop on Turnpike Lane in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>, set up as a
        community co-operative after the area was left without a bookshop of its
        own. Its name comes from the old line &quot;available from all good
        bookshops&quot;, and it has been on Turnpike Lane since 2020 &quot;as a
        positive force for the arts&quot;.
      </p>
      <p>
        Run largely by volunteers and members, it pairs the shelves with a
        gallery and a small events room hosting music, comedy, talks and groups.
        Film comes from local organisers who bring screenings into that events
        programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "a community co-operative bookshop and arts space on Turnpike Lane";
export const seoHighlights =
  "screenings hosted alongside music, comedy, talks and a monthly gallery";

export default VenueBlurb;

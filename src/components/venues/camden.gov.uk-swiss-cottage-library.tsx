import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Swiss Cottage Library on Avenue Road is one of London&apos;s largest
        public libraries, run by{" "}
        <Link href="/london-cinemas/camden/">Camden</Link> Council, with a
        special historical collection of philosophy and psychology books
        alongside its general lending stock.
      </p>
      <p>
        Beyond borrowing and study space it has a café, a Library of Things for
        renting tools and household items, and a programme of activities for all
        ages, and it is the library leading Camden&apos;s work as a Library of
        Sanctuary. Film screenings are part of that community programme, and the
        library invites residents to propose events of their own.
      </p>
    </section>
  );
}

export const seoDescription =
  "one of London's largest public libraries, in Swiss Cottage";
export const seoHighlights = "community film screenings in a public library";

export default VenueBlurb;

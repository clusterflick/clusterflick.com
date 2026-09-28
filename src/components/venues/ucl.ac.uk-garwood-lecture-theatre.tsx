import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Garwood Lecture Theatre is on the first floor of the South Wing of
        UCL&apos;s main building on Gower Street in Bloomsbury,{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>, reached across the
        quad from the main gate, with step-free access.
      </p>
      <p>
        Like many of UCL&apos;s lecture theatres it is used beyond teaching, by
        departments and student societies putting on public talks and events.
        Its screenings are film club nights open to the public, such as
        documentaries shown with a discussion afterwards.
      </p>
    </section>
  );
}

export const seoDescription = "UCL lecture theatre in Bloomsbury";
export const seoHighlights = "film club documentary screenings at UCL";

export default VenueBlurb;

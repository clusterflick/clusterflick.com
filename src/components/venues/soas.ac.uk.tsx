import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        SOAS University of London, founded in 1916, is the specialist university
        for the study of Asia, Africa and the Middle East, with its campus in
        Bloomsbury, <Link href="/london-cinemas/camden/">Camden</Link>. Its
        community spans over 130 nationalities, and its research covers the
        languages, cultures, politics and histories of those regions.
      </p>
      <p>
        Its lecture theatres host public screenings drawn from that expertise,
        from classic cinema to new documentaries, often with a discussion
        afterwards. They sit alongside talks and events on the film cultures of
        the regions it studies.
      </p>
    </section>
  );
}

export const seoDescription =
  "Bloomsbury university for Asia, Africa and the Middle East";
export const seoHighlights =
  "screenings and discussions from Asia, Africa and the Middle East";

export default VenueBlurb;

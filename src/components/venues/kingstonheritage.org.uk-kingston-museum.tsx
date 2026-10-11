import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Kingston Museum on Wheatfield Way is the council-run museum for{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>,
        custom built in 1904. Free to enter, it calls itself &quot;a small but
        buzzing museum&quot;, with three permanent exhibitions, Ancient Origins,
        Town of Kings and one on local pioneer photographer Eadweard Muybridge,
        alongside an Art Gallery of changing shows.
      </p>
      <p>
        Its displays cover how stop-motion animation and film projection were
        created. Screenings here are one-off events held in the museum, among
        its programme of talks and workshops.
      </p>
    </section>
  );
}

export const seoDescription =
  "Kingston's 1904 museum, home of the Eadweard Muybridge collection";
export const seoHighlights = "occasional screenings in a local museum";

export default VenueBlurb;

import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Ciné-Real is the UK&apos;s only film club dedicated exclusively to
        screening films on 16mm, founded in 2011 by Oscar-longlisted director
        Liam Saint-Pierre and projectionist Ümit Mesut of the legendary Ümit &
        Son film emporium in Clapton. The pair search the planet for rare 16mm
        prints, bringing audiences everything from classic Hollywood
        (Casablanca, When Harry Met Sally) to arthouse gems (Alphaville), all
        projected on original celluloid with the projector visible in the cinema
        so audiences can experience the magic of analogue film firsthand. With
        intermissions for reel changes and Ümit&apos;s famous on-the-spot
        repairs (timed by the audience), each screening is a unique,
        unpredictable event.
      </p>
      <p>
        Now in permanent residency at{" "}
        <Link href="/venues/the-castle-cinema">The Castle Cinema</Link> in
        Homerton, Ciné-Real has been selling out monthly screenings for years,
        building a passionate community of film lovers and filmmakers united by
        their appreciation for the warmth and colour reproduction that only 16mm
        can deliver. Before each screening, Liam and Ümit introduce the film and
        share insights, creating an intimate, conversational atmosphere that
        feels like stepping into Cinema Paradiso. There&apos;s even a raffle at
        the end with prizes like Ciné-Real tote bags and super 8mm prints.
        It&apos;s not resistance against digital—just an elegant case for why
        celluloid and digital should coexist.
      </p>
    </section>
  );
}

export const seoDescription = "16mm film club in Homerton";
export const seoHighlights =
  "rare 16mm prints, classic Hollywood and arthouse gems";

export default VenueBlurb;

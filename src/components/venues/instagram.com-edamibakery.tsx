import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Edami is a Lebanese bakery on Shacklewell Lane in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, practically next
        door to the Shacklewell Arms. Its counter is built around manakish,
        baked fresh to order and topped with za&apos;atar and cheese or
        something sweet, alongside spinach fatayer, ka&apos;ak and
        &quot;syrup-soaked pastries&quot;, with Lebanese coffee, fresh juices
        and ayran to drink.
      </p>
      <p>
        The room is a counter and a handful of round tables under Crittall
        windows. Once the bakery has closed for the day, outside organisers take
        it over for evening events, screenings and talks among them.
      </p>
    </section>
  );
}

export const seoDescription = "Lebanese bakery on Shacklewell Lane in Hackney";
export const seoHighlights = "evening screenings and talks";

export default VenueBlurb;

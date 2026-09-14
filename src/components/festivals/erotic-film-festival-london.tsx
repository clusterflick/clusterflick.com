import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Erotic Film Festival London, which brands itself EFF London, says it is
        &ldquo;here to showcase bold, beautifully crafted films that explore
        desire, intimacy, and human connection&rdquo;. In its own words, it is
        &ldquo;the beginning of a movement that recognises erotic cinema as one
        of the most vital, under-explored frontiers in contemporary
        cinema&rdquo;.
      </p>
      <p>
        It is a short film festival, calling for work of 31 minutes or less that
        is &ldquo;bold, daring, and unforgettable &mdash; whether hot and
        steamy, intimate and tender, thought-provoking or tense&rdquo;, in
        &ldquo;any genre, from documentary to sci-fi, fantasy to kink, animation
        to experimental&rdquo;. Selections are &ldquo;grouped into curated
        programmes, each offering a different perspective on intimacy, desire,
        and connection&rdquo;, and the festival gives a Film of the Festival
        award, a Special Mention and an Audience Award voted for in the room.
      </p>
      <p>
        It runs over a weekend each October, taking a different pair of rooms
        each year rather than a fixed home &mdash; recent editions have been at{" "}
        <Link href="/venues/coldharbour-blue">Coldharbour Blue</Link> in
        Loughborough Junction and{" "}
        <Link href="/venues/the-bath-house">The Bath House</Link> on Eastway in
        Hackney Wick, which the festival bills as Eastway Baths. Alongside the
        film programme it puts on exhibitions, live performances, talks and
        workshops.
      </p>
    </section>
  );
}

export const seoDescription =
  "a short film festival showcasing bold, beautifully crafted films that explore desire, intimacy and human connection";
export const seoHighlights =
  "curated erotic shorts programmes, exhibitions, live performances, talks and workshops";

export default FestivalBlurb;

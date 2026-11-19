import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getSourceNames } from "@/utils/get-source-names";
import { getLondonMidnightTimestamp } from "@clusterflick/catalogue/utils/format-date";
import { getStatusStats } from "./components/status-section/get-status-stats";
import AboutPageContent from "./about-page-content";
import { VENUE_COUNT } from "@/utils/venue-count";
import { FILM_CLUBS } from "@clusterflick/catalogue/data/film-clubs";
import { FESTIVALS } from "@clusterflick/catalogue/data/festivals";

export const metadata: Metadata = {
  title: "About",
  description: `Why Clusterflick is the most complete guide to film in London: every listing from ${VENUE_COUNT} venues combined, film clubs and festivals matched, and open data.`,
  alternates: {
    canonical: "/about",
  },
};

// Answers mirror content visible on this page — a requirement for valid
// FAQPage structured data.
const faqs = [
  {
    question: "What is Clusterflick?",
    answer: `Clusterflick is the most complete guide to film in London: a free site combining every listing from ${VENUE_COUNT} venues, from multiplexes to pubs and community halls, into one search. It reads each listing for format, accessibility and occasion so you can filter for exactly the screening you want, matches ${FILM_CLUBS.length} film clubs and ${FESTIVALS.length} festivals across the venues they screen at, and shows ratings from IMDb, Letterboxd, Rotten Tomatoes and Metacritic side by side. It's independent, nobody pays to be listed, and its code and data are open.`,
  },
  {
    question: "Where does Clusterflick's film data come from?",
    answer:
      "Clusterflick gets showing details directly from each venue and event source. The film-related metadata (including actor, director, synopses, release dates, trailers and poster art) is supplied by The Movie Database (TMDB). Clusterflick uses the TMDB API but is not endorsed or certified by TMDB.",
  },
  {
    question: "How often is the showing data updated?",
    answer:
      "The showing data is refreshed from each venue and event source several times a day.",
  },
  {
    question: "Is Clusterflick open source?",
    answer:
      "Yes, the code for the Clusterflick website and the processing pipeline is open source and available on GitHub, under the MIT licence.",
  },
  {
    question: "Can I use Clusterflick's screening data in my own project?",
    answer:
      "Yes. The showing data is refreshed several times a day, available in two formats, and free to use — including commercially — under CC BY 4.0, as long as you credit us. Film metadata supplied by TMDB is excluded and stays subject to TMDB's own terms; the data licence page has the full terms.",
  },
];

const aboutJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://clusterflick.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "About",
        item: "https://clusterflick.com/about",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

export default async function AboutPage() {
  const data = await getStaticData();
  const stats = getStatusStats(
    data,
    getLondonMidnightTimestamp(),
    getSourceNames(),
  );

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <AboutPageContent stats={stats} />
    </main>
  );
}

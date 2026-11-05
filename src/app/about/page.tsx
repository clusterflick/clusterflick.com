import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getLondonMidnightTimestamp } from "@/utils/format-date";
import { getStatusStats } from "./components/status-section/get-status-stats";
import AboutPageContent from "./about-page-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Clusterflick – the open source project helping you find film screenings across London cinemas.",
  alternates: {
    canonical: "/about",
  },
};

// Answers mirror content visible on this page — a requirement for valid
// FAQPage structured data.
const faqs = [
  {
    question: "What is Clusterflick?",
    answer:
      "Clusterflick is a free site listing every film showing in London — 450+ venues, one search.",
  },
  {
    question: "Where does Clusterflick's film data come from?",
    answer:
      "Clusterflick gets showing details directly from each venue and event source. The film-related metadata (including actor, director, synopses, release dates, trailers and poster art) is supplied by The Movie Database (TMDB). Clusterflick uses the TMDB API but is not endorsed or certified by TMDB.",
  },
  {
    question: "How often is the showing data updated?",
    answer:
      "The showing data is refreshed from each venue and event source daily.",
  },
  {
    question: "Is Clusterflick open source?",
    answer:
      "Yes, the code for the Clusterflick website and the processing pipeline is open source and available on GitHub, under the MIT licence.",
  },
  {
    question: "Can I use Clusterflick's screening data in my own project?",
    answer:
      "Yes. The showing data is refreshed daily, available in two formats, and free to use — including commercially — under CC BY 4.0, as long as you credit us. Film metadata supplied by TMDB is excluded and stays subject to TMDB's own terms; the data licence page has the full terms.",
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
  const stats = getStatusStats(data, getLondonMidnightTimestamp());

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

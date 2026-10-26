import type { Metadata } from "next";
import { getReleaseStatus } from "@/utils/get-release-status";
import DatasetsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Clusterflick publishes its London cinema screening data as a JSON file and a calendar feed for every venue. Here's what's in them, where to get them, and how to tell when they've changed.",
  alternates: {
    canonical: "/datasets",
  },
};

export default function DatasetsPage() {
  return <DatasetsPageContent status={getReleaseStatus()} />;
}

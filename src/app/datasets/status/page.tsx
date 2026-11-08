import type { Metadata } from "next";
import { getReleaseStatus } from "@/utils/get-release-status";
import DataStatusPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Data Status",
  description:
    "The release history of Clusterflick's published datasets: how long they have been released, how often, and when in the day new data lands.",
  alternates: {
    canonical: "/datasets/status",
  },
};

export default function DataStatusPage() {
  return <DataStatusPageContent status={getReleaseStatus()} />;
}

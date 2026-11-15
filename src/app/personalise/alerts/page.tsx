import type { Metadata } from "next";
import AlertsSettingsPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Your Email Alerts",
  description:
    "Choose whether you get a daily email about the films on your watchlist, and what counts as news.",
  alternates: {
    canonical: "/personalise/alerts",
  },
  // An account page, as /personalise is.
  robots: { index: false },
};

export default function AlertsSettingsPage() {
  return <AlertsSettingsPageContent />;
}

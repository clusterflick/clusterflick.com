import type { Metadata } from "next";
import ConnectPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Connect your AI assistant",
  description: "Sign in to let your AI assistant search Clusterflick.",
  // Only ever reached from an assistant's sign-in, mid-way through.
  robots: { index: false, follow: false },
};

export default function ConnectPage() {
  return <ConnectPageContent />;
}

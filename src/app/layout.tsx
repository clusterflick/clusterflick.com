import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import clsx from "clsx";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Every Film Showing in London — Search London Cinema Listings | Clusterflick",
    template: "%s | Clusterflick",
  },
  description:
    "Compare screenings across London cinemas and find your perfect movie night. Whether you're chasing new releases or cult classics, see what's on, where, and when.",
  keywords: [
    "cinema",
    "movies",
    "London",
    "film screenings",
    "movie showtimes",
    "independent cinema",
    "arthouse",
  ],
  authors: [{ name: "Clusterflick" }],
  creator: "Clusterflick",
  metadataBase: new URL("https://clusterflick.com"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://clusterflick.com",
    siteName: "Clusterflick",
    title: "Clusterflick – Every film, every cinema, one place",
    description:
      "Compare screenings across London cinemas and find your perfect movie night. Whether you're chasing new releases or cult classics, see what's on, where, and when.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 675,
        alt: "Clusterflick",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clusterflick – Every film, every cinema, one place",
    description:
      "Compare screenings across London cinemas and find your perfect movie night.",
    creator: "@clusterflick",
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="80a133a1-82b7-47ce-9b96-2baca324b9ea"
        />
      </head>
      <body className={clsx(montserrat.variable, inter.variable)}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <CinemaDataProvider>
          <FilterConfigProvider>
            <GeolocationProvider>{children}</GeolocationProvider>
          </FilterConfigProvider>
        </CinemaDataProvider>
      </body>
    </html>
  );
}

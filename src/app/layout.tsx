"use client";
import { CinemaDataProvider, GetCinemaData } from "@/state/cinema-data-context";
import { FiltersProvider } from "@/state/filters-context";
import { UserSettingsProvider } from "@/state/user-settings-context";
import "rsuite/dist/rsuite.min.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CinemaDataProvider>
          <GetCinemaData>
            <UserSettingsProvider>
              <FiltersProvider>{children}</FiltersProvider>
            </UserSettingsProvider>
          </GetCinemaData>
        </CinemaDataProvider>
      </body>
    </html>
  );
}

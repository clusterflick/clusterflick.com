"use client";
import { CinemaDataProvider, GetCinemaData } from "@/state/cinema-data-context";
import { FiltersProvider } from "@/state/filters-context";
import { UserSettingsProvider } from "@/state/user-settings-context";
import "rsuite/dist/rsuite.min.css";

const appLoadingTracker = `
// Add a progress info when the app is loading by tracking chunks as webpack
// loads them in
(function () {
  // Grab the script details before the frameworks loads and modifies the DOM
  var $appScripts = document.querySelectorAll("script[async]");
  window.addEventListener("DOMContentLoaded", function () {
    var $webpackScript = document.querySelector('script[src*="webpack"]');
    var $appLoadingPercentage = document.querySelector(".loading-percentage");
    if (!$appScripts || !$appLoadingPercentage || !$webpackScript) return;

    function updateProgressAsChunksLoad() {
      var originalPush = window.webpackChunk_N_E.push;
      Object.defineProperty(window.webpackChunk_N_E, "push", {
        value: function () {
          var result = originalPush.apply(this, arguments);
          var percentage = Math.round((this.length / $appScripts.length) * 100);
          $appLoadingPercentage.innerHTML = "[" + percentage + "%]";
          return result;
        },
        // Let webpage overrwrite the push function
        writable: true
      });
    }

    if (window.webpackChunk_N_E) {
      updateProgressAsChunksLoad();
    } else {
      $webpackScript.addEventListener("load", function () {
        updateProgressAsChunksLoad();
      });
    }
  });
})();
`;

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
      <body>
        <CinemaDataProvider>
          <GetCinemaData>
            <UserSettingsProvider>
              <FiltersProvider>{children}</FiltersProvider>
            </UserSettingsProvider>
          </GetCinemaData>
        </CinemaDataProvider>
        <script dangerouslySetInnerHTML={{ __html: appLoadingTracker }} />
      </body>
    </html>
  );
}

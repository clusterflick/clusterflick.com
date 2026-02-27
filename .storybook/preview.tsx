import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import { Montserrat, Inter } from "next/font/google";
import clsx from "clsx";
import { handlers } from "./msw/handlers";
import "../src/app/globals.css";
import "react-virtualized/styles.css";
import "./preview.css";

// Load Google Fonts with Next.js optimization
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass", // Don't warn about unhandled requests (images, etc.)
});

const preview: Preview = {
  // initialGlobals sets the active background value used by the backgrounds
  // addon in all rendering contexts — including inline story previews on
  // autodocs pages (where toolbar state doesn't propagate).
  initialGlobals: {
    backgrounds: { value: "#010013" },
  },

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    // Default viewport and backgrounds
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#010013" },
        { name: "light", value: "#ffffff" },
      ],
    },

    layout: "fullscreen",

    // MSW handlers - default handlers pass through to real data files
    msw: {
      handlers,
    },
  },

  // Add MSW loader to handle network requests
  loaders: [mswLoader],

  // Global decorators to apply fonts and set env var
  decorators: [
    (Story) => {
      // Clear filter state from sessionStorage before each story so that
      // persisted filters don't leak between stories or across sessions.
      React.useEffect(() => {
        sessionStorage.removeItem("clusterflick-filters");
        return () => sessionStorage.removeItem("clusterflick-filters");
      }, []);

      return <Story />;
    },
    (Story) => {
      React.useEffect(() => {
        // Manually set font CSS variables on document root to ensure they're available
        // This is needed because Storybook's iframe might not pick them up from the className
        const style = getComputedStyle(document.documentElement);
        const interFont =
          style.getPropertyValue("--font-inter") ||
          "'Inter', Arial, Helvetica, sans-serif";
        const montserratFont =
          style.getPropertyValue("--font-montserrat") ||
          "'Montserrat', Arial, Helvetica, sans-serif";

        document.documentElement.style.setProperty("--font-inter", interFont);
        document.documentElement.style.setProperty(
          "--font-montserrat",
          montserratFont,
        );
      }, []);

      return (
        <div className={clsx(montserrat.variable, inter.variable)}>
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

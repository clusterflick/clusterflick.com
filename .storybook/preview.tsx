import React from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import { handlers } from "./msw/handlers";
import "../src/app/globals.css";
import "react-virtualized/styles.css";

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass", // Don't warn about unhandled requests (images, etc.)
});

const preview: Preview = {
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
    (Story) => (
      <div
        style={{
          fontFamily: "Inter, Arial, Helvetica, sans-serif",
          // Set CSS variables for fonts
          ["--font-inter" as any]: "Inter, Arial, Helvetica, sans-serif",
          ["--font-montserrat" as any]:
            "Montserrat, Arial, Helvetica, sans-serif",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;

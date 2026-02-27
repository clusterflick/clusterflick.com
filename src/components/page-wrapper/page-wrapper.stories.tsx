import type { Meta, StoryObj } from "@storybook/react";
import PageWrapper from "@/components/page-wrapper";

/**
 * `PageWrapper` wraps page content with the site's signature mesh-gradient
 * blob background and sets the `<main id="main-content">` landmark. Every
 * full-page layout should be wrapped in this component.
 *
 * **When to use:**
 * - As the outermost wrapper for every page component (listing pages, detail
 *   pages, status pages).
 *
 * **When NOT to use:**
 * - Inside a component that is already inside a `PageWrapper` — only one per
 *   page.
 * - For partial-page sections — wrap only the page root, not individual
 *   sections.
 */
const meta = {
  title: "Components/PageWrapper",
  component: PageWrapper,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default usage — shows the mesh gradient background. */
export const Default: Story = {
  args: {
    children: (
      <div
        style={{
          padding: "60px 40px",
          textAlign: "center",
          fontSize: 18,
          opacity: 0.8,
        }}
      >
        Page content goes here
      </div>
    ),
  },
};

/** With taller content to show the gradient extending down the page. */
export const TallContent: Story = {
  args: {
    children: (
      <div style={{ padding: "60px 40px" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <p
            key={i}
            style={{ opacity: 0.7, marginBottom: 16, lineHeight: 1.7 }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
        ))}
      </div>
    ),
  },
};

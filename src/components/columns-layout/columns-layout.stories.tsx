import type { Meta, StoryObj } from "@storybook/react";
import ColumnsLayout from ".";
import ContentSection from "@/components/content-section";

/**
 * A two-column responsive layout with a main content area and a sidebar.
 * Stacks vertically on mobile, side-by-side at 768px+.
 *
 * Used on detail pages (venues, boroughs, festivals, film clubs) to pair
 * descriptive content with a sidebar of related information.
 */
const meta = {
  title: "Layout/ColumnsLayout",
  component: ColumnsLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof ColumnsLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both columns populated with content sections. */
export const Default: Story = {
  args: {
    main: (
      <ContentSection title="About" as="h2">
        <p style={{ lineHeight: 1.7, opacity: 0.8 }}>
          This is the main content area, typically used for descriptive text
          like an &ldquo;About&rdquo; blurb or introductory copy.
        </p>
      </ContentSection>
    ),
    sidebar: (
      <>
        <ContentSection title="Details" as="h3">
          <p style={{ opacity: 0.7 }}>Sidebar section one.</p>
        </ContentSection>
        <ContentSection title="More Info" as="h3">
          <p style={{ opacity: 0.7 }}>Sidebar section two.</p>
        </ContentSection>
      </>
    ),
  },
};

/** When the main column has no content, the sidebar still renders correctly. */
export const SidebarOnly: Story = {
  args: {
    main: null,
    sidebar: (
      <>
        <ContentSection title="Address" as="h3">
          <p style={{ opacity: 0.7 }}>123 Example Street, London</p>
        </ContentSection>
        <ContentSection title="Accessibility" as="h3">
          <p style={{ opacity: 0.7 }}>Audio described, subtitled</p>
        </ContentSection>
      </>
    ),
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  CloseIcon,
  PlayIcon,
  EmailIcon,
  LetterboxdIcon,
  InstagramIcon,
  RedditIcon,
  ThreadsIcon,
  XIcon,
  BlueskyIcon,
  GoogleCalendarIcon,
  OutlookCalendarIcon,
  CalendarIcon,
  MenuIcon,
} from "@/components/icons";

/**
 * All SVG icons used across the site. Icons accept a `size` prop (in pixels)
 * and all `SVGProps` — including `style`, `className`, and `aria-label`.
 *
 * All icons are `aria-hidden="true"` by default since they are always used
 * alongside visible text or an explicit `aria-label` on the parent element.
 * If an icon is used standalone (no adjacent text), add an `aria-label` on
 * the wrapping element.
 *
 * **UI icons** (navigation, controls):
 * `ArrowLeftIcon`, `ChevronDownIcon`, `CloseIcon`, `PlayIcon`, `MenuIcon`,
 * `CalendarIcon`
 *
 * **Social icons** (venue/festival profile links):
 * `LetterboxdIcon`, `InstagramIcon`, `XIcon`, `BlueskyIcon`, `ThreadsIcon`,
 * `RedditIcon`, `EmailIcon`
 *
 * **Calendar export icons**:
 * `GoogleCalendarIcon`, `OutlookCalendarIcon`
 */
const meta = {
  title: "Components/Icons",
  component: ArrowLeftIcon,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 12, max: 64, step: 4 },
      description: "Icon size in pixels.",
    },
  },
} satisfies Meta<typeof ArrowLeftIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

const iconStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  opacity: 0.7,
};

const galleryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
  gap: 24,
  padding: 8,
};

/** All UI icons used for navigation and interactive controls. */
export const UIIcons: Story = {
  args: {},
  render: () => (
    <div style={galleryStyle}>
      {[
        { label: "ArrowLeft", icon: <ArrowLeftIcon size={24} /> },
        { label: "ChevronDown", icon: <ChevronDownIcon size={24} /> },
        { label: "Close", icon: <CloseIcon size={24} /> },
        { label: "Play", icon: <PlayIcon size={24} /> },
        { label: "Menu", icon: <MenuIcon size={24} /> },
        { label: "Calendar", icon: <CalendarIcon size={24} /> },
      ].map(({ label, icon }) => (
        <div key={label} style={iconStyle}>
          {icon}
          <span>{label}</span>
        </div>
      ))}
    </div>
  ),
};

/** Social platform icons used on venue and festival profile pages. */
export const SocialIcons: Story = {
  args: {},
  render: () => (
    <div style={galleryStyle}>
      {[
        { label: "Letterboxd", icon: <LetterboxdIcon size={32} /> },
        { label: "Instagram", icon: <InstagramIcon size={32} /> },
        { label: "X", icon: <XIcon size={32} /> },
        { label: "Bluesky", icon: <BlueskyIcon size={32} /> },
        { label: "Threads", icon: <ThreadsIcon size={32} /> },
        { label: "Reddit", icon: <RedditIcon size={32} /> },
        { label: "Email", icon: <EmailIcon size={32} /> },
      ].map(({ label, icon }) => (
        <div key={label} style={iconStyle}>
          {icon}
          <span>{label}</span>
        </div>
      ))}
    </div>
  ),
};

/** Calendar export icons used in the "Add to calendar" feature. */
export const CalendarIcons: Story = {
  args: {},
  render: () => (
    <div style={galleryStyle}>
      {[
        { label: "GoogleCalendar", icon: <GoogleCalendarIcon size={24} /> },
        { label: "Outlook", icon: <OutlookCalendarIcon size={24} /> },
      ].map(({ label, icon }) => (
        <div key={label} style={iconStyle}>
          {icon}
          <span>{label}</span>
        </div>
      ))}
    </div>
  ),
};

/** Size variations for a single icon. */
export const Sizes: Story = {
  args: {},
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
      {[16, 20, 24, 32, 40, 48].map((size) => (
        <div key={size} style={iconStyle}>
          <ArrowLeftIcon size={size} />
          <span>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import AlertsSettingsPageContent from "@/app/personalise/alerts/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";

function AlertsSettingsPageWrapper({
  user,
}: {
  user: Partial<UserContextType>;
}) {
  return (
    <CinemaDataProvider>
      <FilterConfigProvider>
        <GeolocationProvider>
          <MockUserProvider value={user}>
            <AlertsSettingsPageContent />
          </MockUserProvider>
        </GeolocationProvider>
      </FilterConfigProvider>
    </CinemaDataProvider>
  );
}

/**
 * `/personalise/alerts/`: alerts on or off, and what about a watchlist film
 * counts as news, saved with one button.
 */
const meta = {
  title: "Pages/Alerts Settings Page",
  component: AlertsSettingsPageWrapper,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
    backgrounds: { default: "dark" },
  },
} satisfies Meta<typeof AlertsSettingsPageWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const READER = {
  status: "signed-in",
  email: "reader@example.com",
  readCapabilities: async () => ({
    [CapabilityId.EmailAlerts]: { grantedAt: 0 },
  }),
} satisfies Partial<UserContextType>;

/**
 * Never set up: off, with the quiet two triggers ready. Switching on and
 * saving writes them.
 */
export const NotSetUp: Story = {
  args: { user: { ...READER, saveAlertSettings: fn(async () => {}) } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const enabled = await canvas.findByRole("checkbox", {
      name: "Send me alerts",
    });
    await expect(enabled).not.toBeChecked();
    await expect(
      canvas.getByRole("checkbox", { name: "When it's first listed" }),
    ).toBeChecked();
    await expect(
      canvas.getByRole("checkbox", { name: "When any showing is added" }),
    ).not.toBeChecked();
    await userEvent.click(enabled);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.user.saveAlertSettings).toHaveBeenCalledWith({
        enabled: true,
        alerts: [{ type: "watchlist", notify: ["firstListing", "newVenue"] }],
      }),
    );
  },
};

/** On, with nothing to be told about: it won't save until there's one. */
export const NeedsATrigger: Story = {
  args: {
    user: {
      ...READER,
      readAlertSettings: async () => ({
        enabled: true,
        alerts: [{ type: "watchlist", notify: ["newVenue"] }],
      }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", {
        name: "When it's showing somewhere new",
      }),
    );
    await expect(
      canvas.getByText("Choose at least one thing to be told about"),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Save" })).toBeDisabled();
  },
};

/** Not granted, and never on: nothing to set up. */
export const NotGranted: Story = {
  args: { user: { ...READER, readCapabilities: async () => ({}) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText("Not switched on for you yet"),
    ).toBeInTheDocument();
  },
};

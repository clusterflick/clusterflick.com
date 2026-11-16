import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import AlertsSettingsPageContent from "@/app/personalise/alerts/page-content";
import { CinemaDataProvider } from "@/state/cinema-data-context";
import { FilterConfigProvider } from "@/state/filter-config-context";
import { GeolocationProvider } from "@/state/geolocation-context";
import { MockUserProvider, type UserContextType } from "@/state/user-context";
import { CapabilityId } from "@/lib/user-capabilities";
import { ALERTS_ORIGIN } from "@/lib/user-alerts";

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
    // The alerts Worker's preview, as it answers before any run.
    msw: {
      handlers: [
        http.post(`${ALERTS_ORIGIN}/preview`, () =>
          HttpResponse.json({
            mode: "sinceLastRun",
            baseline: true,
            lastRun: null,
            digest: null,
          }),
        ),
      ],
    },
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

const EMAIL = `<!doctype html><html><body style="background:#111;color:#eee;font-family:sans-serif;padding:24px">
<h2><a href="#" style="color:#e4a11b">Halloween</a></h2><p>Now showing</p>
<ul><li>Tomorrow 19:30 · Rio Cinema</li><li>Wed 20:00 · Prince Charles Cinema</li></ul>
</body></html>`;

/**
 * Beside the settings, the email they would send: here with everything on
 * the watchlist that's showing.
 */
export const WithPreview: Story = {
  args: {
    user: {
      ...READER,
      readAlertSettings: async () => ({
        enabled: true,
        alerts: [{ type: "watchlist", notify: ["firstListing", "newVenue"] }],
      }),
    },
  },
  parameters: {
    msw: {
      handlers: [
        http.post(`${ALERTS_ORIGIN}/preview`, async ({ request }) => {
          const { mode } = (await request.json()) as { mode: string };
          return HttpResponse.json({
            mode,
            baseline: false,
            lastRun: "2026-11-16",
            digest:
              mode === "everythingShowing"
                ? {
                    subject: "Halloween: Now showing",
                    html: EMAIL,
                    text: "Halloween",
                    films: 1,
                  }
                : null,
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Nothing new since the last check/),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Everything showing" }),
    );
    await expect(
      await canvas.findByText("Halloween: Now showing"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTitle("The email, as it would arrive"),
    ).toBeInTheDocument();
  },
};

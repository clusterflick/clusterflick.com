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
    // The alerts Worker: its preview, as it answers before any run, and
    // remembering the watchlist when alerts are switched on.
    msw: {
      handlers: [
        http.post(`${ALERTS_ORIGIN}/remember`, () =>
          HttpResponse.json({ films: 1 }),
        ),
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
      canvas.getByRole("checkbox", { name: "When any screening is added" }),
    ).not.toBeChecked();
    await userEvent.click(enabled);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.user.saveAlertSettings).toHaveBeenCalledWith({
        enabled: true,
        alerts: [
          {
            type: "watchlist",
            notify: ["firstListing", "newVenue"],
            newVenueScope: "any",
          },
        ],
      }),
    );
  },
};

/**
 * Switched on, but the Worker couldn't remember the watchlist: the alerts
 * are on, and the page says the first email may come a day later.
 */
export const SwitchedOnNotRemembered: Story = {
  args: { user: { ...READER, saveAlertSettings: fn(async () => {}) } },
  parameters: {
    msw: {
      handlers: [
        http.post(
          `${ALERTS_ORIGIN}/remember`,
          () => new HttpResponse(null, { status: 503 }),
        ),
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", { name: "Send me alerts" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(
      await canvas.findByText(/your first email may come a day later/),
    ).toBeInTheDocument();
    await expect(args.user.saveAlertSettings).toHaveBeenCalled();
  },
};

/** On, with nothing to be told about: it won't save until there's one. */
export const NeedsATrigger: Story = {
  args: {
    user: {
      ...READER,
      readAlertSettings: async () => ({
        enabled: true,
        alerts: [
          { type: "watchlist", notify: ["newVenue"], newVenueScope: "any" },
        ],
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

/**
 * Somewhere new, only at favourite venues: chosen under that switch, saved
 * with the triggers, and a reader with no favourites yet is told it won't
 * find anything until they have some.
 */
export const FavouriteVenuesOnly: Story = {
  args: {
    user: {
      ...READER,
      favouriteVenues: {},
      saveAlertSettings: fn(async () => {}),
      readAlertSettings: async () => ({
        enabled: true,
        alerts: [
          {
            type: "watchlist",
            notify: ["firstListing", "newVenue"],
            newVenueScope: "any",
          },
        ],
      }),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("radio", { name: "Only my favourite venues" }),
    );
    await expect(
      canvas.getByText(/You haven't favourited any venues yet/),
    ).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.user.saveAlertSettings).toHaveBeenCalledWith({
        enabled: true,
        alerts: [
          {
            type: "watchlist",
            notify: ["firstListing", "newVenue"],
            newVenueScope: "favourites",
          },
        ],
      }),
    );
  },
};

/**
 * A saved search beside the watchlist alert: this page edits only the
 * watchlist's, keeps the search when it saves, and lets the watchlist's
 * triggers all go off, since the search still has something to say.
 */
export const KeepsSavedSearches: Story = {
  args: {
    user: {
      ...READER,
      saveAlertSettings: fn(async () => {}),
      readAlertSettings: async () => ({
        enabled: true,
        alerts: [
          { type: "watchlist", notify: ["newVenue"], newVenueScope: "any" },
          {
            type: "search",
            id: "s1",
            query: "venues=rio",
            label: "Rio",
            notify: ["firstListing"],
            newVenueScope: "any",
          },
        ],
      }),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("checkbox", {
        name: "When it's showing somewhere new",
      }),
    );
    await expect(
      canvas.queryByText("Choose at least one thing to be told about"),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(args.user.saveAlertSettings).toHaveBeenCalledWith({
        enabled: true,
        alerts: [
          {
            type: "search",
            id: "s1",
            query: "venues=rio",
            label: "Rio",
            notify: ["firstListing"],
            newVenueScope: "any",
          },
        ],
      }),
    );
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
        alerts: [
          {
            type: "watchlist",
            notify: ["firstListing", "newVenue"],
            newVenueScope: "any",
          },
        ],
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
      canvas.getByRole("button", { name: "Example email" }),
    );
    await expect(
      await canvas.findByText("Halloween: Now showing"),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTitle("The email, as it would arrive"),
    ).toBeInTheDocument();
  },
};

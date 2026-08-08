import { Page } from "@playwright/test";

const CALENDAR_SELECTOR = ".fc";
const EVENT_SELECTOR = ".fc-event";
const TOOLBAR_TITLE_SELECTOR = ".fc-toolbar-title";

export class VenueCalendarPage {
  constructor(private page: Page) {}

  async goto(venueSlug: string) {
    await this.page.goto(`/venues/${venueSlug}/calendar`);
  }

  /**
   * The calendar is client-rendered and fetches its ICS feed after mount, so
   * "loaded" means the grid exists — not merely that the document arrived.
   */
  async waitForCalendar() {
    await this.page
      .locator(CALENDAR_SELECTOR)
      .first()
      .waitFor({ timeout: 15000 });
  }

  async waitForEvents() {
    await this.page.locator(EVENT_SELECTOR).first().waitFor({ timeout: 15000 });
  }

  async countEvents(): Promise<number> {
    return this.page.locator(EVENT_SELECTOR).count();
  }

  async getTitle(): Promise<string | null> {
    return this.page.locator(TOOLBAR_TITLE_SELECTOR).first().textContent();
  }

  async goToNextPeriod() {
    await this.page.locator(".fc-next-button").click();
  }

  async switchToAgenda() {
    await this.page.locator(".fc-listWeek-button").click();
  }

  async screenshot(name: string) {
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {
      // Don't fail if timeout — images may still be loading
    }
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }
}

import { Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";
// The nav menu and site footer link to /venues/ from every page, so the prefix
// match alone picks up chrome links — and the (hidden) menu one comes first in
// the DOM. Excluding the section index itself leaves only real venue links.
const VENUE_LINK_SELECTOR = 'a[href^="/venues/"]:not([href="/venues/"])';
const VENUE_NAME_SELECTOR = `${VENUE_LINK_SELECTOR} [data-testid="link-grid-label"]`;
const SEARCH_INPUT_SELECTOR = 'input[placeholder="Filter venues..."]';

export class VenuesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${SITE_URL}/venues`);
    await this.page.waitForSelector("h1", { timeout: 10000 });
  }

  async getFirstVenueName(): Promise<string | null> {
    return this.page.locator(VENUE_NAME_SELECTOR).first().textContent();
  }

  async clickFirstVenue() {
    await this.page.locator(VENUE_LINK_SELECTOR).first().click();
  }

  async searchForVenue(name: string) {
    await this.page.fill(SEARCH_INPUT_SELECTOR, name);
  }

  async getVisibleVenueCount(): Promise<number> {
    return this.page.locator(VENUE_LINK_SELECTOR).count();
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

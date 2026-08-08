import { Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";
// The nav menu and site footer link to /london-cinemas/ from every page, so the
// prefix match alone picks up chrome links — and the (hidden) menu one comes
// first in the DOM. Excluding the section index itself leaves only boroughs.
const BOROUGH_LINK_SELECTOR =
  'a[href^="/london-cinemas/"]:not([href="/london-cinemas/"])';
const BOROUGH_NAME_SELECTOR = `${BOROUGH_LINK_SELECTOR} [data-testid="link-grid-label"]`;

export class LondonCinemasPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${SITE_URL}/london-cinemas`);
    await this.page.waitForSelector("h1", { timeout: 10000 });
  }

  async getFirstBoroughName(): Promise<string | null> {
    return this.page.locator(BOROUGH_NAME_SELECTOR).first().textContent();
  }

  async clickFirstBorough() {
    await this.page.locator(BOROUGH_LINK_SELECTOR).first().click();
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

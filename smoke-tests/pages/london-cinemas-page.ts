import { Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";
const BOROUGH_LINK_SELECTOR = 'a[href^="/london-cinemas/"]';
const BOROUGH_NAME_SELECTOR = '[class*="boroughName"]';

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

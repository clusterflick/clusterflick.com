import { Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";
const FESTIVAL_CARD_SELECTOR = 'a[href^="/festivals/"]';
const FESTIVAL_CARD_NAME_SELECTOR = '[data-testid="event-card-name"]';

export class FestivalsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${SITE_URL}/festivals`);
    await this.page.waitForSelector("h1", { timeout: 10000 });
  }

  async hasFestivals(): Promise<boolean> {
    return (await this.page.locator(FESTIVAL_CARD_SELECTOR).count()) > 0;
  }

  async getFirstFestivalName(): Promise<string | null> {
    return this.page.locator(FESTIVAL_CARD_NAME_SELECTOR).first().textContent();
  }

  async clickFirstFestival() {
    await this.page.locator(FESTIVAL_CARD_SELECTOR).first().click();
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

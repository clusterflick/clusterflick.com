import { Page } from "@playwright/test";

const BACK_LINK_SELECTOR = 'a[href="/london-cinemas/"]';
const VENUE_CARD_SELECTOR = '[class*="venueCard"]';

export class BoroughDetailPage {
  constructor(private page: Page) {}

  async waitForPage(expectedBoroughName: string) {
    await this.page.waitForURL(/\/london-cinemas\/[^/]+\/?$/, {
      timeout: 10000,
    });
    await this.page
      .locator("h1")
      .filter({ hasText: expectedBoroughName })
      .waitFor({ timeout: 5000 });
  }

  async hasBackToAllBoroughsLink(): Promise<boolean> {
    return this.page.locator(BACK_LINK_SELECTOR).isVisible();
  }

  async getVenueCardCount(): Promise<number> {
    return this.page.locator(VENUE_CARD_SELECTOR).count();
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

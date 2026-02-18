import { expect, Page } from "@playwright/test";

const PERFORMANCE_CARD_SELECTOR = '[class*="performanceCard"]';

export class MovieDetailsPage {
  constructor(private page: Page) {}

  async waitForPage(expectedTitle: string) {
    await this.page.waitForURL(/\/movies\/\d+\//, { timeout: 10000 });
    await expect(this.page.locator("h1").first()).toContainText(expectedTitle, {
      timeout: 5000,
    });
  }

  async waitForPerformances() {
    await this.page.waitForSelector(PERFORMANCE_CARD_SELECTOR, {
      timeout: 15000,
    });
  }

  async countPerformances(): Promise<number> {
    return await this.page.locator(PERFORMANCE_CARD_SELECTOR).count();
  }

  async screenshot(name: string) {
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {
      // Don't fail if timeout - images may still be loading from slow CDN
    }
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }
}

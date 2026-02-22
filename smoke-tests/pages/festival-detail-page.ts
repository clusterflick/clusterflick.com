import { Page } from "@playwright/test";

const BACK_LINK_SELECTOR = 'a[href="/festivals"]';
const STATUS_CARD_SELECTOR = '[class*="statusCard"]';

export class FestivalDetailPage {
  constructor(private page: Page) {}

  async waitForPage(expectedName: string) {
    await this.page.waitForURL(/\/festivals\/[^/]+$/, { timeout: 10000 });
    await this.page
      .locator("h1")
      .filter({ hasText: expectedName })
      .waitFor({ timeout: 5000 });
  }

  async hasBackToFestivalsLink(): Promise<boolean> {
    return this.page.locator(BACK_LINK_SELECTOR).isVisible();
  }

  async getStatusCardText(): Promise<string | null> {
    return this.page.locator(STATUS_CARD_SELECTOR).first().textContent();
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

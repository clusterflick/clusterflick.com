import { Page } from "@playwright/test";

const STATUS_CARD_SELECTOR = '[class*="statusCard"]';

export class VenueDetailPage {
  constructor(private page: Page) {}

  async waitForPage(expectedName: string) {
    await this.page.waitForURL(/\/venues\/[^/]+$/, { timeout: 10000 });
    await this.page
      .locator("h1")
      .filter({ hasText: expectedName })
      .waitFor({ timeout: 5000 });
  }

  async hasAddressSection(): Promise<boolean> {
    return this.page.getByRole("heading", { name: "Address" }).isVisible();
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

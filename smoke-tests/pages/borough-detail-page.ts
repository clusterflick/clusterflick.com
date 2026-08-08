import { Page } from "@playwright/test";

// The nav menu and site footer also link to /london-cinemas/, so the back link
// is identified by its place in the header identity group rather than its href.
const BACK_LINK_SELECTOR = '[data-header-logo] a[href="/london-cinemas/"]';
// Excludes the chrome links to the /venues/ index (see venues-page.ts).
const VENUE_CARD_SELECTOR = 'a[href^="/venues/"]:not([href="/venues/"])';

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

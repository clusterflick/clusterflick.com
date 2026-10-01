import { Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";
// The nav menu and site footer link to /festivals/ from every page, so the
// prefix match alone picks up chrome links — and the (hidden) menu one comes
// first in the DOM. Excluding the section index itself leaves only real cards.
const FESTIVAL_CARD_SELECTOR =
  'a[href^="/festivals/"]:not([href="/festivals/"])';
// The page leads with a featured festival whenever any festival is listed —
// the cards below leave it out, and with only one festival there are no cards
// at all — so its heading link is the one festival link always present.
const FEATURED_FESTIVAL_LINK_SELECTOR = "#featured-festival a";

export class FestivalsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${SITE_URL}/festivals`);
    await this.page.waitForSelector("h1", { timeout: 10000 });
  }

  async hasFestivals(): Promise<boolean> {
    return (await this.page.locator(FESTIVAL_CARD_SELECTOR).count()) > 0;
  }

  async getFeaturedFestivalName(): Promise<string | null> {
    return this.page.locator(FEATURED_FESTIVAL_LINK_SELECTOR).textContent();
  }

  async clickFeaturedFestival() {
    await this.page.locator(FEATURED_FESTIVAL_LINK_SELECTOR).click();
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

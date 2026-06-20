import { expect, Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";

const POSTER_SELECTOR = 'a[href^="/movies/"]';
const POSTER_TITLE_SELECTOR = `${POSTER_SELECTOR} h2`;
const FILTER_TRIGGER_SELECTOR = 'button[aria-label*="filter options"]';
const SEARCH_INPUT_SELECTOR = "#filter-search";
const FILTER_COUNTS_SELECTOR = '[aria-live="polite"][aria-atomic="true"]';

/** The browse/filter grid, which now lives at /films (the home page is discovery). */
export class FilmsPage {
  constructor(private page: Page) {}

  async goto() {
    // Enter via the real journey: land on the discovery home page, then click
    // through to the films grid.
    await this.page.goto(SITE_URL);
    await this.page
      .getByRole("link", { name: /Browse all films/i })
      .first()
      .click();
    await this.page.waitForURL(/\/films\/?$/);
    await this.page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await this.waitForAllDataLoaded();
    await this.waitForFilterAvailable();
  }

  async waitForAllDataLoaded() {
    await expect(this.page.getByText("Loading movies...")).toBeHidden({
      timeout: 30000,
    });
  }

  async waitForFilterAvailable() {
    await expect(this.page.locator(FILTER_TRIGGER_SELECTOR)).toBeVisible({
      timeout: 10000,
    });
    await this.page.click(FILTER_TRIGGER_SELECTOR);
    await this.page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "visible",
      timeout: 5000,
    });
    await this.page.keyboard.press("Escape");
    await this.page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "hidden",
      timeout: 2000,
    });
  }

  async countVisiblePosters(): Promise<number> {
    return await this.page.locator(POSTER_SELECTOR).count();
  }

  async getFirstMovieTitle(): Promise<string | null> {
    // Read the title from the first poster's overlay heading rather than an
    // <img> alt: posters for movies without a TMDB image render a text-pattern
    // placeholder with no <img>, so an image-based lookup would skip them and
    // return a different movie than the one clickFirstPoster() clicks.
    const firstTitle = this.page.locator(POSTER_TITLE_SELECTOR).first();
    return (await firstTitle.textContent())?.trim() ?? null;
  }

  async clickFirstPoster() {
    await this.page.locator(POSTER_SELECTOR).first().click();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
    });
    await this.page.waitForFunction(
      () => {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        return scrollY >= maxScroll - 10;
      },
      { timeout: 5000 },
    );
  }

  async scrollToMiddle(): Promise<number> {
    const targetScroll = await this.page.evaluate(() => {
      const target = Math.floor(document.body.scrollHeight / 2);
      window.scrollTo({ top: target, behavior: "instant" });
      return target;
    });

    try {
      await this.page.waitForFunction(
        (target) => Math.abs(window.scrollY - target) < 200,
        targetScroll,
        { timeout: 5000 },
      );
    } catch (e) {
      const debug = await this.page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollHeight: document.body.scrollHeight,
        innerHeight: window.innerHeight,
        maxScroll: document.body.scrollHeight - window.innerHeight,
      }));
      throw new Error(
        `Scroll-to-middle timed out. Target: ${targetScroll}, actual state: ${JSON.stringify(debug)}`,
        { cause: e },
      );
    }

    return targetScroll;
  }

  // Filter overlay

  async openFilterOverlay() {
    await this.page.click(FILTER_TRIGGER_SELECTOR);
  }

  async closeFilterOverlay() {
    await this.page.keyboard.press("Escape");
    await this.page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "hidden",
      timeout: 2000,
    });
  }

  async searchForMovie(title: string) {
    await this.openFilterOverlay();
    await this.page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "visible",
      timeout: 5000,
    });
    await this.page.fill(SEARCH_INPUT_SELECTOR, title);
    await this.closeFilterOverlay();
  }

  async setDateFilterToTomorrow() {
    await this.openFilterOverlay();
    const countsLocator = this.page.locator(FILTER_COUNTS_SELECTOR);
    await countsLocator.waitFor({ state: "visible", timeout: 5000 });
    const countsBefore = await countsLocator.textContent();
    await this.page
      .locator("label", { hasText: "Tomorrow" })
      .filter({ has: this.page.locator('input[name="date-option"]') })
      .click();
    await expect(countsLocator).not.toHaveText(countsBefore!, {
      timeout: 5000,
    });
    await this.closeFilterOverlay();
  }

  // Utilities

  async screenshot(name: string) {
    await this.waitForImagesToLoad();
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }

  private async waitForImagesToLoad() {
    try {
      await this.page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {
      // Don't fail if timeout - images may still be loading from slow CDN
    }
  }
}

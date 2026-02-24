import { expect, Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";

const POSTER_SELECTOR = 'a[href^="/movies/"]';
const POSTER_IMAGE_SELECTOR = `${POSTER_SELECTOR} img`;
const FILTER_TRIGGER_SELECTOR = 'button[aria-label*="filter options"]';
const SEARCH_INPUT_SELECTOR = "#filter-search";
const COLLAPSE_BUTTON_SELECTOR = 'button[aria-expanded="true"]';
const FILTER_COUNTS_SELECTOR = '[aria-live="polite"][aria-atomic="true"]';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(SITE_URL);
    await this.page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await this.collapseIntroNotice();
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
    const firstImage = this.page.locator(POSTER_IMAGE_SELECTOR).first();
    return await firstImage.getAttribute("alt");
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
    await this.page.click('label[for="chip-date-option-tomorrow"]');
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

  private async collapseIntroNotice() {
    const collapseButton = this.page.locator(COLLAPSE_BUTTON_SELECTOR);
    if (await collapseButton.isVisible({ timeout: 2000 })) {
      await collapseButton.click();
      await this.page.waitForSelector('button[aria-expanded="false"]', {
        timeout: 2000,
      });
    }
  }
}

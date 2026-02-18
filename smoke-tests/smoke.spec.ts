import { test, expect, Page } from "@playwright/test";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";

// Configuration for poster counts
// With virtualization, the visible count stays roughly constant
const EXPECTED_MIN_POSTERS = 6 * 3;
// At the bottom, there may be fewer items (end of list)
const EXPECTED_MIN_POSTERS_AT_BOTTOM = 6 * 2 + 1;

// Selectors
const POSTER_SELECTOR = 'a[href^="/movies/"]';
const POSTER_IMAGE_SELECTOR = `${POSTER_SELECTOR} img`;
const FILTER_TRIGGER_SELECTOR = 'button[aria-label*="filter options"]';
const SEARCH_INPUT_SELECTOR = "#filter-search";
const PERFORMANCE_CARD_SELECTOR = '[class*="performanceCard"]';
const COLLAPSE_BUTTON_SELECTOR = 'button[aria-expanded="true"]';

async function countVisiblePosters(page: Page): Promise<number> {
  return await page.locator(POSTER_SELECTOR).count();
}

async function getFirstMovieTitle(page: Page): Promise<string | null> {
  // Get the title directly from the image alt attribute
  const firstImage = page.locator(POSTER_IMAGE_SELECTOR).first();
  return await firstImage.getAttribute("alt");
}

async function collapseIntroNotice(page: Page): Promise<void> {
  const collapseButton = page.locator(COLLAPSE_BUTTON_SELECTOR);
  if (await collapseButton.isVisible({ timeout: 2000 })) {
    await collapseButton.click();
    // Wait for the section to collapse (button text changes to "Expand")
    await page.waitForSelector('button[aria-expanded="false"]', {
      timeout: 2000,
    });
  }
}

async function waitForScrollToBottom(page: Page): Promise<void> {
  // Wait for scroll to reach the bottom of the page
  await page.waitForFunction(
    () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      return scrollY >= maxScroll - 10; // within 10px of bottom
    },
    { timeout: 5000 },
  );
}

async function waitForImagesToLoad(page: Page): Promise<void> {
  // Wait for network to be idle (no requests for 500ms)
  // This helps ensure images have loaded before screenshots
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Don't fail if timeout - images may still be loading from slow CDN
  }
}

test.describe("Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("main page shows expected number of posters on desktop", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for posters to load
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await collapseIntroNotice(page);

    await expect(async () => {
      const posterCount = await countVisiblePosters(page);
      expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
    }).toPass({ timeout: 5000 });

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/initial-load.png",
    });
  });

  test("scrolling to bottom loads more posters", async ({ page }) => {
    await page.goto(SITE_URL);

    // Wait for initial posters
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await collapseIntroNotice(page);

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
    });

    // Wait for scroll to actually reach the bottom
    await waitForScrollToBottom(page);

    await expect(async () => {
      const posterCount = await countVisiblePosters(page);
      expect(posterCount).toBeGreaterThanOrEqual(
        EXPECTED_MIN_POSTERS_AT_BOTTOM,
      );
    }).toPass({ timeout: 5000 });

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-scroll-bottom.png",
    });
  });

  test("scrolling back to middle maintains expected poster count", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for initial posters
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await collapseIntroNotice(page);

    // Wait for all data chunks to finish loading before scrolling,
    // otherwise the grid can expand mid-test as later chunks arrive.
    await expect(page.getByText("Loading movies...")).toBeHidden({
      timeout: 30000,
    });

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
    });

    // Wait for scroll to reach the bottom
    await waitForScrollToBottom(page);

    // Calculate a concrete target position before scrolling, so it isn't
    // invalidated by virtualisation re-rendering and changing scrollHeight.
    const targetScroll = await page.evaluate(() => {
      const target = Math.floor(document.body.scrollHeight / 2);
      window.scrollTo({ top: target, behavior: "instant" });
      return target;
    });

    // Wait for the scroll position to arrive near the target we requested.
    // We avoid re-reading scrollHeight here because virtualisation may have
    // already changed it by the time this runs.
    try {
      await page.waitForFunction(
        (target) => {
          return Math.abs(window.scrollY - target) < 200;
        },
        targetScroll,
        { timeout: 5000 },
      );
    } catch (e) {
      const debug = await page.evaluate(() => ({
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

    // Wait for virtualized list to render posters for the new viewport
    try {
      await expect(async () => {
        const posterCount = await countVisiblePosters(page);
        expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
      }).toPass({ timeout: 5000 });
    } catch (e) {
      const debug = await page.evaluate(() => ({
        scrollY: window.scrollY,
        posterCount: document.querySelectorAll('a[href^="/movies/"]').length,
        scrollHeight: document.body.scrollHeight,
        innerHeight: window.innerHeight,
      }));
      throw new Error(
        `Poster count check failed after scroll-to-middle. State: ${JSON.stringify(debug)}`,
        { cause: e },
      );
    }

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-scroll-middle.png",
    });
  });

  test("search for first movie title shows exactly 1 match", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for posters to load
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await collapseIntroNotice(page);

    // Get the first movie title from the image alt attribute
    const firstMovieTitle = await getFirstMovieTitle(page);
    expect(firstMovieTitle).toBeTruthy();

    // Open filter overlay
    await page.click(FILTER_TRIGGER_SELECTOR);

    // Wait for search input to be visible
    await page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "visible",
      timeout: 5000,
    });

    // Type the movie title
    await page.fill(SEARCH_INPUT_SELECTOR, firstMovieTitle!);

    // Close overlay by pressing escape
    await page.keyboard.press("Escape");

    // Wait for overlay to close (search input should be hidden)
    await page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "hidden",
      timeout: 2000,
    });

    // Wait for filter to apply and show exactly 1 result
    await expect(async () => {
      const searchResultCount = await countVisiblePosters(page);
      expect(searchResultCount).toBe(1);
    }).toPass({ timeout: 5000 });

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-search.png",
    });
  });

  test("clicking first poster loads movie details with at least one performance", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for posters to load
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    await collapseIntroNotice(page);

    // Set date filter to "Tomorrow" so every visible movie is guaranteed to
    // have future performances (avoids flakes when today's are all in the past)
    await page.click(FILTER_TRIGGER_SELECTOR);
    const countsLocator = page.locator(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    await countsLocator.waitFor({ state: "visible", timeout: 5000 });
    const countsBefore = await countsLocator.textContent();
    await page.click("#chip-date-option-tomorrow");
    await expect(countsLocator).not.toHaveText(countsBefore!, {
      timeout: 5000,
    });
    await page.keyboard.press("Escape");
    await page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "hidden",
      timeout: 2000,
    });

    // Get the first movie title for verification later
    const expectedTitle = await getFirstMovieTitle(page);
    expect(expectedTitle).toBeTruthy();

    // Click on the first poster
    await page.locator(POSTER_SELECTOR).first().click();

    // Wait for navigation to movie details page
    await page.waitForURL(/\/movies\/\d+\//, { timeout: 10000 });

    // Verify the page title matches the movie we clicked
    const pageTitle = await page.locator("h1").first().textContent();
    expect(pageTitle).toContain(expectedTitle);

    // Wait for performances to load (they load asynchronously)
    await page.waitForSelector(PERFORMANCE_CARD_SELECTOR, { timeout: 15000 });

    const performanceCount = await page
      .locator(PERFORMANCE_CARD_SELECTOR)
      .count();

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/movie-details.png",
    });

    expect(performanceCount).toBeGreaterThanOrEqual(1);
  });
});

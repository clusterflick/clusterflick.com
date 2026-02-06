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

async function countVisiblePosters(page: Page): Promise<number> {
  return await page.locator(POSTER_SELECTOR).count();
}

async function getFirstMovieTitle(page: Page): Promise<string | null> {
  // Get the title directly from the image alt attribute
  const firstImage = page.locator(POSTER_IMAGE_SELECTOR).first();
  return await firstImage.getAttribute("alt");
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

async function waitForScrollToPosition(
  page: Page,
  targetY: number,
): Promise<void> {
  // Wait for scroll to reach a specific position
  await page.waitForFunction(
    (target) => {
      return Math.abs(window.scrollY - target) < 50; // within 50px
    },
    targetY,
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

async function waitForPosterCountToChange(
  page: Page,
  previousCount: number,
  timeout = 5000,
): Promise<number> {
  // Used for search/filter where the actual count changes
  const startTime = Date.now();
  let currentCount = previousCount;

  while (Date.now() - startTime < timeout) {
    currentCount = await countVisiblePosters(page);
    if (currentCount !== previousCount) {
      return currentCount;
    }
    await page.waitForTimeout(100);
  }

  return currentCount;
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

    const posterCount = await countVisiblePosters(page);

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/initial-load.png",
    });

    expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
  });

  test("scrolling to bottom loads more posters", async ({ page }) => {
    await page.goto(SITE_URL);

    // Wait for initial posters
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for scroll to actually reach the bottom
    await waitForScrollToBottom(page);

    const posterCount = await countVisiblePosters(page);

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-scroll-bottom.png",
    });

    expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS_AT_BOTTOM);
  });

  test("scrolling back to middle maintains expected poster count", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for initial posters
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });

    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for scroll to reach the bottom
    await waitForScrollToBottom(page);

    // Get the middle scroll position and scroll there
    const middlePosition = await page.evaluate(() => {
      const middle = document.body.scrollHeight / 2;
      window.scrollTo(0, middle);
      return middle;
    });

    // Wait for scroll to reach the middle
    await waitForScrollToPosition(page, middlePosition);

    const posterCount = await countVisiblePosters(page);

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-scroll-middle.png",
    });

    expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
  });

  test("search for first movie title shows exactly 1 match", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for posters to load
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });
    const initialCount = await countVisiblePosters(page);

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

    // Wait for the poster count to change (filter applied)
    await waitForPosterCountToChange(page, initialCount);

    // Close overlay by pressing escape
    await page.keyboard.press("Escape");

    // Wait for overlay to close (search input should be hidden)
    await page.waitForSelector(SEARCH_INPUT_SELECTOR, {
      state: "hidden",
      timeout: 2000,
    });

    // Count posters after search
    const searchResultCount = await countVisiblePosters(page);

    await waitForImagesToLoad(page);
    await page.screenshot({
      path: "test-results/screenshots/after-search.png",
    });

    expect(searchResultCount).toBe(1);
  });

  test("clicking first poster loads movie details with at least one performance", async ({
    page,
  }) => {
    await page.goto(SITE_URL);

    // Wait for posters to load
    await page.waitForSelector(POSTER_SELECTOR, { timeout: 10000 });

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

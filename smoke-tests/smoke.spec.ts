import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home-page";
import { MovieDetailsPage } from "./pages/movie-details-page";

// With virtualization, the visible count stays roughly constant
const EXPECTED_MIN_POSTERS = 6 * 3;
// At the bottom, there may be fewer items (end of list)
const EXPECTED_MIN_POSTERS_AT_BOTTOM = 6 * 2 + 1;

let home: HomePage;

test.describe("Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    home = new HomePage(page);
    await home.goto();
  });

  test("main page shows expected number of posters on desktop", async ({
    page,
  }) => {
    await expect(async () => {
      const posterCount = await home.countVisiblePosters();
      expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
    }).toPass({ timeout: 5000 });

    await home.screenshot("initial-load");
  });

  test("scrolling to bottom loads more posters", async ({ page }) => {
    await home.scrollToBottom();

    await expect(async () => {
      const posterCount = await home.countVisiblePosters();
      expect(posterCount).toBeGreaterThanOrEqual(
        EXPECTED_MIN_POSTERS_AT_BOTTOM,
      );
    }).toPass({ timeout: 5000 });

    await home.screenshot("after-scroll-bottom");
  });

  test("scrolling back to middle maintains expected poster count", async ({
    page,
  }) => {
    await home.scrollToBottom();
    await home.scrollToMiddle();

    try {
      await expect(async () => {
        const posterCount = await home.countVisiblePosters();
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

    await home.screenshot("after-scroll-middle");
  });

  test("search for first movie title shows exactly 1 match", async ({
    page,
  }) => {
    const firstMovieTitle = await home.getFirstMovieTitle();
    expect(firstMovieTitle).toBeTruthy();

    await home.searchForMovie(firstMovieTitle!);

    await expect(async () => {
      const searchResultCount = await home.countVisiblePosters();
      expect(searchResultCount).toBe(1);
    }).toPass({ timeout: 5000 });

    await home.screenshot("after-search");
  });

  test("clicking first poster loads movie details with at least one performance", async ({
    page,
  }) => {
    await home.setDateFilterToTomorrow();

    const expectedTitle = await home.getFirstMovieTitle();
    expect(expectedTitle).toBeTruthy();

    await home.clickFirstPoster();

    const movieDetails = new MovieDetailsPage(page);
    await movieDetails.waitForPage(expectedTitle!);

    await movieDetails.waitForPerformances();
    const performanceCount = await movieDetails.countPerformances();

    await movieDetails.screenshot("movie-details");

    expect(performanceCount).toBeGreaterThanOrEqual(1);
  });
});

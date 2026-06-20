import { test, expect } from "@playwright/test";
import { FilmsPage } from "./pages/films-page";
import { MovieDetailsPage } from "./pages/movie-details-page";
import { FestivalsPage } from "./pages/festivals-page";
import { FestivalDetailPage } from "./pages/festival-detail-page";
import { VenuesPage } from "./pages/venues-page";
import { VenueDetailPage } from "./pages/venue-detail-page";
import { LondonCinemasPage } from "./pages/london-cinemas-page";
import { BoroughDetailPage } from "./pages/borough-detail-page";

const SITE_URL = process.env.SITE_URL || "https://clusterflick.com";

// With virtualization, the visible count stays roughly constant
const EXPECTED_MIN_POSTERS = 6 * 3;
// At the bottom, there may be fewer items (end of list)
const EXPECTED_MIN_POSTERS_AT_BOTTOM = 6 * 2 + 1;

let filmsPage: FilmsPage;

test.describe("Films Grid (browse & filter)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    filmsPage = new FilmsPage(page);
    await filmsPage.goto();
  });

  test("films page shows expected number of posters on desktop", async () => {
    await expect(async () => {
      const posterCount = await filmsPage.countVisiblePosters();
      expect(posterCount).toBeGreaterThanOrEqual(EXPECTED_MIN_POSTERS);
    }).toPass({ timeout: 5000 });

    await filmsPage.screenshot("initial-load");
  });

  test("scrolling to bottom loads more posters", async () => {
    await filmsPage.scrollToBottom();

    await expect(async () => {
      const posterCount = await filmsPage.countVisiblePosters();
      expect(posterCount).toBeGreaterThanOrEqual(
        EXPECTED_MIN_POSTERS_AT_BOTTOM,
      );
    }).toPass({ timeout: 5000 });

    await filmsPage.screenshot("after-scroll-bottom");
  });

  test("scrolling back to middle maintains expected poster count", async ({
    page,
  }) => {
    await filmsPage.scrollToBottom();
    await filmsPage.scrollToMiddle();

    try {
      await expect(async () => {
        const posterCount = await filmsPage.countVisiblePosters();
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

    await filmsPage.screenshot("after-scroll-middle");
  });

  test("search for first movie title shows exactly 1 match", async () => {
    const firstMovieTitle = await filmsPage.getFirstMovieTitle();
    expect(firstMovieTitle).toBeTruthy();

    await filmsPage.searchForMovie(firstMovieTitle!);

    await expect(async () => {
      const searchResultCount = await filmsPage.countVisiblePosters();
      expect(searchResultCount).toBe(1);
    }).toPass({ timeout: 5000 });

    await filmsPage.screenshot("after-search");
  });

  test("clicking first poster loads movie details with at least one performance", async ({
    page,
  }) => {
    await filmsPage.setDateFilterToTomorrow();

    const expectedTitle = await filmsPage.getFirstMovieTitle();
    expect(expectedTitle).toBeTruthy();

    await filmsPage.clickFirstPoster();

    const movieDetails = new MovieDetailsPage(page);
    await movieDetails.waitForPage(expectedTitle!);

    await movieDetails.waitForPerformances();
    const performanceCount = await movieDetails.countPerformances();

    await movieDetails.screenshot("movie-details");

    expect(performanceCount).toBeGreaterThanOrEqual(1);
  });
});

let festivalsPage: FestivalsPage;

test.describe("Festival Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    festivalsPage = new FestivalsPage(page);
    await festivalsPage.goto();
  });

  test("festivals list page renders heading and count", async ({ page }) => {
    await expect(page.locator("h1").first()).toContainText("Festivals");

    const hasFestivals = await festivalsPage.hasFestivals();
    if (hasFestivals) {
      await expect(page.getByText(/\d+ festivals? running/)).toBeVisible();
    } else {
      await expect(
        page.getByText("No festivals currently running"),
      ).toBeVisible();
    }

    await festivalsPage.screenshot("festivals-list");
  });

  test("clicking a festival card navigates to its detail page", async ({
    page,
  }) => {
    const hasFestivals = await festivalsPage.hasFestivals();
    if (!hasFestivals) {
      test.skip();
      return;
    }

    const firstName = await festivalsPage.getFirstFestivalName();
    expect(firstName).toBeTruthy();

    await festivalsPage.clickFirstFestival();

    const detailPage = new FestivalDetailPage(page);
    await detailPage.waitForPage(firstName!);

    expect(await detailPage.hasBackToFestivalsLink()).toBe(true);

    const statusText = await detailPage.getStatusCardText();
    expect(statusText).toBeTruthy();

    await detailPage.screenshot("festival-detail");
  });
});

let venuesPage: VenuesPage;

test.describe("Venue Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    venuesPage = new VenuesPage(page);
    await venuesPage.goto();
  });

  test("venues list page renders heading and venue count", async ({ page }) => {
    await expect(page.locator("h1").first()).toContainText("Venues");
    await expect(page.getByText(/\d+ venues across London/)).toBeVisible();

    await venuesPage.screenshot("venues-list");
  });

  test("venue search filters the list", async () => {
    const totalBefore = await venuesPage.getVisibleVenueCount();
    expect(totalBefore).toBeGreaterThan(1);

    await venuesPage.searchForVenue("curzon");

    await expect(async () => {
      const filtered = await venuesPage.getVisibleVenueCount();
      expect(filtered).toBeGreaterThanOrEqual(1);
      expect(filtered).toBeLessThan(totalBefore);
    }).toPass({ timeout: 3000 });

    await venuesPage.screenshot("venues-search");
  });

  test("clicking a venue navigates to its detail page", async ({ page }) => {
    const firstName = await venuesPage.getFirstVenueName();
    expect(firstName).toBeTruthy();

    await venuesPage.clickFirstVenue();

    const detailPage = new VenueDetailPage(page);
    await detailPage.waitForPage(firstName!);

    expect(await detailPage.hasAddressSection()).toBe(true);

    const statusText = await detailPage.getStatusCardText();
    expect(statusText).toBeTruthy();

    await detailPage.screenshot("venue-detail");
  });
});

let londonCinemasPage: LondonCinemasPage;

test.describe("London Cinemas Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    londonCinemasPage = new LondonCinemasPage(page);
    await londonCinemasPage.goto();
  });

  test("london cinemas list page renders heading and borough count", async ({
    page,
  }) => {
    await expect(page.locator("h1").first()).toContainText("London Cinemas");
    await expect(
      page.getByText(/Find screening venues across \d+ London boroughs/),
    ).toBeVisible();

    await londonCinemasPage.screenshot("london-cinemas-list");
  });

  test("clicking a borough navigates to its detail page", async ({ page }) => {
    const firstName = await londonCinemasPage.getFirstBoroughName();
    expect(firstName).toBeTruthy();

    await londonCinemasPage.clickFirstBorough();

    const boroughPage = new BoroughDetailPage(page);
    await boroughPage.waitForPage(firstName!);

    expect(await boroughPage.hasBackToAllBoroughsLink()).toBe(true);

    const venueCount = await boroughPage.getVenueCardCount();
    expect(venueCount).toBeGreaterThanOrEqual(1);

    await boroughPage.screenshot("borough-detail");
  });
});

test.describe("Discovery Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SITE_URL);
  });

  test("home page surfaces discovery sections, nav and the browse CTA", async ({
    page,
  }) => {
    // Discovery rows render real movie links (poster rows).
    await expect(page.locator('a[href^="/movies/"]').first()).toBeVisible({
      timeout: 10000,
    });

    // The "Showing Across London" popularity row is the first discovery section.
    await expect(
      page.getByRole("heading", { name: "Showing Across London" }),
    ).toBeVisible();

    // Prominent CTA into the full grid at /films.
    const browseCta = page
      .getByRole("link", { name: /Browse all films/i })
      .first();
    await expect(browseCta).toBeVisible();
    await expect(browseCta).toHaveAttribute("href", /\/films\/?$/);

    // Nav now links to Films (the grid) and no longer to "Near Me".
    await expect(
      page.getByRole("link", { name: "Films", exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Near Me" })).toHaveCount(0);

    await page.screenshot({
      path: "test-results/screenshots/discovery-home.png",
    });
  });
});

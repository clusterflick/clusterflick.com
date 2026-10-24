import { test, expect } from "@playwright/test";
import { FilmsPage } from "./pages/films-page";
import { MovieDetailsPage } from "./pages/movie-details-page";
import { FestivalsPage } from "./pages/festivals-page";
import { FestivalDetailPage } from "./pages/festival-detail-page";
import { VenuesPage } from "./pages/venues-page";
import { VenueDetailPage } from "./pages/venue-detail-page";
import { VenueCalendarPage } from "./pages/venue-calendar-page";
import { LondonCinemasPage } from "./pages/london-cinemas-page";
import { BoroughDetailPage } from "./pages/borough-detail-page";
import { expectIndexableMetadata, getMetadata } from "./utils/metadata";

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

  test("films page has indexable SEO metadata", async ({ page }) => {
    await expectIndexableMetadata(page, {
      titleContains: "Every Film Showing in London",
      canonicalPath: "/catalogue",
    });
  });

  // The catalogue moved from /films. Links into /films carry filters (cast and
  // crew, venue, genre links), so the redirect — Cloudflare's 301, or the page's
  // own fallback — must keep the query. The catalogue strips applied params
  // from the address bar, so check the filter took effect rather than the URL.
  test("the old /films URL redirects with its filters", async ({ page }) => {
    await page.goto(`${SITE_URL}/films/?base=all&genres=18`);
    await page.waitForURL(/\/catalogue\//);
    await expect(page.locator("[data-filter-summary]")).toContainText("Drama", {
      timeout: 15000,
    });
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

    await expectIndexableMetadata(page, {
      titleContains: expectedTitle!,
      canonicalPath: new URL(page.url()).pathname,
    });
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

    const firstName = await festivalsPage.getFeaturedFestivalName();
    expect(firstName).toBeTruthy();

    await festivalsPage.clickFeaturedFestival();

    const detailPage = new FestivalDetailPage(page);
    await detailPage.waitForPage(firstName!);

    expect(await detailPage.hasBackToFestivalsLink()).toBe(true);

    const statusText = await detailPage.getStatusCardText();
    expect(statusText).toBeTruthy();

    await detailPage.screenshot("festival-detail");

    await expectIndexableMetadata(page, {
      titleContains: firstName!,
      canonicalPath: new URL(page.url()).pathname,
    });
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
    await expect(page.locator("h1").first()).toContainText(
      "Every Cinema in London",
    );
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

    await expectIndexableMetadata(page, {
      titleContains: firstName!,
      canonicalPath: new URL(page.url()).pathname,
    });
  });
});

// A venue busy enough that any week of the year has something programmed, so
// the test can assert on real events rather than an empty grid.
const CALENDAR_VENUE_SLUG = "prince-charles-cinema";
const CALENDAR_VENUE_ID = "princecharlescinema.com";

test.describe("Venue Calendar Page", () => {
  let calendarPage: VenueCalendarPage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    calendarPage = new VenueCalendarPage(page);
    await calendarPage.goto(CALENDAR_VENUE_SLUG);
  });

  // The page reads the published feed itself — the same address a calendar
  // app subscribes to (see CLAUDE.md, Published Data) — not a copy of it.
  test("calendar loads the published feed", async ({ page }) => {
    const feed = page.waitForResponse((response) =>
      response.url().endsWith(`/datasets/calendars/${CALENDAR_VENUE_ID}.ics`),
    );
    await calendarPage.goto(CALENDAR_VENUE_SLUG);
    expect((await feed).status()).toBe(200);
  });

  test("calendar renders showings from the ICS feed", async () => {
    await calendarPage.waitForCalendar();
    await calendarPage.waitForEvents();

    expect(await calendarPage.countEvents()).toBeGreaterThan(0);
    expect(await calendarPage.getTitle()).toBeTruthy();

    await calendarPage.screenshot("venue-calendar");
  });

  test("the back link returns to the venue page", async ({ page }) => {
    await calendarPage.waitForCalendar();

    await page
      .getByRole("link", { name: /Prince Charles Cinema/i })
      .first()
      .click();

    await page.waitForURL(new RegExp(`/venues/${CALENDAR_VENUE_SLUG}/?$`), {
      timeout: 10000,
    });
  });

  test("switching to the agenda view keeps showing events", async () => {
    await calendarPage.waitForCalendar();
    await calendarPage.waitForEvents();

    await calendarPage.switchToAgenda();
    await calendarPage.waitForEvents();

    expect(await calendarPage.countEvents()).toBeGreaterThan(0);

    await calendarPage.screenshot("venue-calendar-agenda");
  });

  // The calendar has nothing crawlable of its own (see CLAUDE.md, Venue
  // Calendars): it should stay out of the index and credit the venue page.
  test("calendar page is noindex and credits the venue page as canonical", async ({
    page,
  }) => {
    const metadata = await getMetadata(page);

    expect(metadata.robots).toContain("noindex");
    expect(metadata.robots).toContain("follow");

    expect(metadata.canonical).toBeTruthy();
    const canonicalPath = new URL(metadata.canonical!).pathname.replace(
      /\/$/,
      "",
    );
    expect(canonicalPath).toBe(`/venues/${CALENDAR_VENUE_SLUG}`);
  });
});

// The datasets licensed for reuse, hosted at fixed addresses (see CLAUDE.md,
// Published Data). People link to these and fetch them on a schedule, so a
// missing file or a cache rule that stopped matching breaks someone else's
// site rather than ours.
test.describe("Published Data", () => {
  const PUBLISHED_PATHS = [
    "/datasets/index.json",
    `/datasets/venues/${CALENDAR_VENUE_ID}.json`,
    `/datasets/calendars/${CALENDAR_VENUE_ID}.ics`,
  ];

  test("the index names every venue's files and the releases", async ({
    request,
  }) => {
    const response = await request.get("/datasets/index.json");
    expect(response.status()).toBe(200);
    const index = await response.json();

    expect(index.releases.data.tag).toBeTruthy();
    expect(index.releases.calendar.tag).toBeTruthy();
    expect(index.venues[CALENDAR_VENUE_ID]).toEqual({
      data: `/datasets/venues/${CALENDAR_VENUE_ID}.json`,
      calendar: `/datasets/calendars/${CALENDAR_VENUE_ID}.ics`,
    });
  });

  test("a venue's data and calendar files are served", async ({ request }) => {
    const data = await request.get(
      `/datasets/venues/${CALENDAR_VENUE_ID}.json`,
    );
    expect(data.status()).toBe(200);
    expect(Array.isArray(await data.json())).toBe(true);

    const calendar = await request.get(
      `/datasets/calendars/${CALENDAR_VENUE_ID}.ics`,
    );
    expect(calendar.status()).toBe(200);
    expect(await calendar.text()).toMatch(/^BEGIN:VCALENDAR/);
  });

  // A browser app should be able to read them directly.
  test("published files allow cross-origin reads", async ({ request }) => {
    for (const path of PUBLISHED_PATHS) {
      const response = await request.get(path);
      expect(response.headers()["access-control-allow-origin"], path).toBe("*");
    }
  });

  // Cloudflare's own rule caches `.json` for a year and doesn't cache `.ics`
  // at all. These fixed names need the cache rule for their paths instead:
  // cached at the edge, and never held by a browser for more than an hour.
  // Only the live site sits behind Cloudflare, so a local run skips this.
  test("published files are cached briefly at the edge", async ({
    request,
  }) => {
    test.skip(
      new URL(SITE_URL).hostname !== "clusterflick.com",
      "Cache headers are set by Cloudflare in front of the live site",
    );

    for (const path of PUBLISHED_PATHS) {
      const response = await request.get(path);
      const headers = response.headers();
      const maxAge = Number(
        /max-age=(\d+)/.exec(headers["cache-control"] ?? "")?.[1],
      );
      expect(maxAge, `${path} cache-control`).toBeLessThanOrEqual(3600);
      expect(["DYNAMIC", "BYPASS"], `${path} cf-cache-status`).not.toContain(
        headers["cf-cache-status"],
      );
    }
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

    await expectIndexableMetadata(page, {
      titleContains: firstName!,
      canonicalPath: new URL(page.url()).pathname,
    });
  });
});

test.describe("Discovery Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SITE_URL);
  });

  test("home page surfaces discovery sections and the browse CTA", async ({
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

    // Prominent CTA into the full grid at /catalogue.
    const browseCta = page
      .getByRole("link", { name: /Browse all films/i })
      .first();
    await expect(browseCta).toBeVisible();
    await expect(browseCta).toHaveAttribute("href", /\/catalogue\/?$/);

    await page.screenshot({
      path: "test-results/screenshots/discovery-home.png",
    });

    await expectIndexableMetadata(page, {
      titleContains: "What's On at London Cinemas",
      canonicalPath: "/",
    });
  });
});

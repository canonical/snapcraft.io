import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const analyticsRegex =
  /https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//;

const customPublishers = ["jetbrains", "kde", "snapcrafters"] as const;
const screenshotViewports = [375, 768, 1280] as const;
const mobileAndDesktopWidths = [375, 1280] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const trustStatusTextByPublisher: Record<string, string> = {
  jetbrains: "Verified account",
  kde: "Verified account",
  snapcrafters: "Star developer",
};

async function interceptAnalytics(page: Page, requests: string[] = []) {
  await page.route(analyticsRegex, async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
}

async function waitForVisualAssets(page: Page) {
  await page.evaluate(async () => {
    const delay = (ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const images = Array.from(document.images);

    for (const image of images) {
      image.loading = "eager";
      const lazySrc = image.dataset?.src;
      if (lazySrc && !image.getAttribute("src")) {
        image.setAttribute("src", lazySrc);
      }
    }

    await Promise.race([
      Promise.all(
        images.map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }

              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
      ),
      delay(5000),
    ]);

    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, delay(5000)]);
    }

    window.scrollTo(0, document.body.scrollHeight);
    await delay(300);
    window.scrollTo(0, 0);
    await delay(300);
  });
}

async function focusWithTab(page: Page, locator: Locator) {
  for (let i = 0; i < 120; i += 1) {
    await page.keyboard.press("Tab");

    const isActive = await locator.evaluate((element) => {
      return element === document.activeElement;
    });

    if (isActive) {
      return;
    }
  }

  throw new Error("Could not reach target element using Tab only.");
}

function formatAxeViolations(
  publisher: string,
  width: number,
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return [
    `Axe violations for ${publisher} at ${width}px:`,
    ...violations.map((violation) => {
      const nodes = violation.nodes
        .map((node) => `${node.target.join(" ")} => ${node.failureSummary || ""}`)
        .join(" | ");
      return `${violation.id}: ${violation.help} (${nodes})`;
    }),
  ].join("\n");
}

test("trust badges are rendered from Store data", async ({ page }) => {
  await interceptAnalytics(page);

  await page.goto("/publisher/jetbrains");
  await expect(
    page.locator(
      'span.p-tooltip:has(span.p-tooltip__message:has-text("Verified account"))',
    ),
  ).toHaveCount(1);

  await page.goto("/publisher/snapcrafters");
  await expect(
    page.locator(
      'span.p-tooltip:has(span.p-tooltip__message:has-text("Star developer"))',
    ),
  ).toHaveCount(1);
});

test("snapcrafters curated page links to publisher search", async ({ page }) => {
  await interceptAnalytics(page);

  await page.goto("/publisher/snapcrafters");

  const seeAllLink = page.getByRole("link", {
    name: "See all snaps published by Snapcrafters ›",
  });

  await expect(seeAllLink).toBeVisible();
  await expect(seeAllLink).toHaveAttribute(
    "href",
    "/search?q=publisher%3Asnapcrafters",
  );

  await seeAllLink.click();

  await expect(page).toHaveURL(/\/search\?q=publisher%3Asnapcrafters$/);
  await expect(page.getByRole("link", { name: "Sublime Text" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Discord" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Alacritty" })).toBeVisible();
});

test("decorative publisher icon and banner are hidden from screen readers", async ({
  page,
}) => {
  await interceptAnalytics(page);

  await page.goto("/publisher/jetbrains");

  const publisherIcon = page.locator(".p-snap-heading__icon").first();
  await expect(publisherIcon).toHaveAttribute("alt", "");

  const banner = page.locator("section.p-strip--image").first();
  await expect(banner).toBeVisible();
  await expect(banner.locator("img")).toHaveCount(0);
});

test("trust status is available via accessibility tree and keyboard focus", async ({
  page,
}) => {
  await interceptAnalytics(page);

  for (const publisher of customPublishers) {
    const trustText = trustStatusTextByPublisher[publisher];

    await page.goto(`/publisher/${publisher}`);
    await waitForVisualAssets(page);

    const trustBadge = page
      .locator(
        `span.p-tooltip:has(span.p-tooltip__message:has-text("${trustText}"))`,
      )
      .first();

    await expect(trustBadge).toHaveCount(1);
    await expect(trustBadge).toHaveAttribute("tabindex", "0");

    await page.locator("body").click({ position: { x: 1, y: 1 } });
    await focusWithTab(page, trustBadge);

    const tooltipMessage = trustBadge.locator(".p-tooltip__message");
    await expect(tooltipMessage).toContainText(trustText);
    await expect(tooltipMessage).toBeVisible();
  }
});

test("custom publisher pages pass WCAG 2.1 AA axe checks", async ({ page }) => {
  await interceptAnalytics(page);

  for (const publisher of customPublishers) {
    for (const width of mobileAndDesktopWidths) {
      await page.setViewportSize({ width, height: 2400 });
      await page.goto(`/publisher/${publisher}`);
      await waitForVisualAssets(page);

      const axeResult = await new AxeBuilder({ page })
        .exclude(".js-nav-account")
        .withTags(axeTags)
        .analyze();

      expect(
        axeResult.violations,
        formatAxeViolations(publisher, width, axeResult.violations),
      ).toEqual([]);
    }
  }
});

for (const publisher of customPublishers) {
  for (const width of screenshotViewports) {
    test(`visual baseline: ${publisher} at ${width}px`, async ({ page }) => {
      await interceptAnalytics(page);

      await page.setViewportSize({ width, height: 2400 });
      await page.goto(`/publisher/${publisher}`);
      await waitForVisualAssets(page);

      await expect(page).toHaveScreenshot(`${publisher}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}

test("analytics keep publisher page_view path and never reach GA", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  for (const publisher of customPublishers) {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:8011",
    });
    const page = await context.newPage();

    const analyticsRequests: string[] = [];
    await interceptAnalytics(page, analyticsRequests);

    await page.goto(`/publisher/${publisher}`);

    const acceptCookies = page.getByRole("button", { name: /accept/i });
    if (await acceptCookies.count()) {
      await acceptCookies.first().click();
    }

    await page.waitForFunction(() => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
      return Array.isArray(dataLayer)
        ? dataLayer.some(
            (entry) =>
              typeof entry === "object" &&
              entry !== null &&
              ["page_view", "pageview"].includes(
                String((entry as Record<string, unknown>).event),
              ),
          )
        : false;
    });

    const pageViewEvents = await page.evaluate(() => {
      const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
      if (!Array.isArray(dataLayer)) {
        return [];
      }

      return dataLayer.filter(
        (entry) =>
          typeof entry === "object" &&
          entry !== null &&
          ["page_view", "pageview"].includes(
            String((entry as Record<string, unknown>).event),
          ),
      );
    });

    expect(pageViewEvents).toHaveLength(1);
    await expect(page).toHaveURL(new RegExp(`/publisher/${publisher}$`));

    const gaDeliveryRequests = analyticsRequests.filter(
      (url) => !url.includes("www.googletagmanager.com/gtm.js"),
    );
    expect(gaDeliveryRequests).toEqual([]);

    const gtmRequests = analyticsRequests.filter((url) =>
      url.includes("www.googletagmanager.com/gtm.js"),
    );
    expect(gtmRequests).toHaveLength(1);

    await context.close();
  }
});

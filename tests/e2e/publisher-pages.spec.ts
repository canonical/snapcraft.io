import AxeBuilder from "@axe-core/playwright";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const baseUrl = "http://127.0.0.1:8011";
const customPublishers = ["jetbrains", "kde", "snapcrafters"] as const;
const screenshotViewports = [375, 768, 1280] as const;
const mobileAndDesktopWidths = [375, 1280] as const;
const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function setEssentialCookie(context: BrowserContext) {
  await context.addCookies([
    {
      name: "_cookies_accepted",
      value: "essential",
      url: baseUrl,
    },
  ]);
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

function formatAxeViolations(
  publisher: string,
  width: number,
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return [
    `Axe violations for ${publisher} at ${width}px:`,
    ...violations.map((violation) => {
      const nodes = violation.nodes
        .map(
          (node) => `${node.target.join(" ")} => ${node.failureSummary || ""}`,
        )
        .join(" | ");
      return `${violation.id}: ${violation.help} (${nodes})`;
    }),
  ].join("\n");
}

test("trust badges are rendered from Store data", async ({ page }) => {
  await setEssentialCookie(page.context());

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

test("snapcrafters curated page links to publisher search", async ({
  page,
}) => {
  await setEssentialCookie(page.context());

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
  await setEssentialCookie(page.context());

  await page.goto("/publisher/jetbrains");

  const publisherIcon = page.locator(".p-snap-heading__icon").first();
  await expect(publisherIcon).toHaveAttribute("alt", "");

  const banner = page.locator("section.p-strip--image").first();
  await expect(banner).toBeVisible();
  await expect(banner.locator("img")).toHaveCount(0);
});

test("listed snaps unavailable state renders and passes axe", async ({
  page,
}) => {
  await setEssentialCookie(page.context());

  await page.goto("/publisher/unavailable-snaps");

  await expect(
    page.getByText("This publisher's snaps are not available right now."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "See all snaps published by Unavailable Snaps ›",
    }),
  ).toBeVisible();

  const axeResult = await new AxeBuilder({ page })
    .exclude(".js-nav-account")
    .withTags(axeTags)
    .analyze();

  expect(
    axeResult.violations,
    formatAxeViolations("unavailable-snaps", 1280, axeResult.violations),
  ).toEqual([]);
});

test("custom publisher pages pass WCAG 2.1 AA axe checks", async ({ page }) => {
  await setEssentialCookie(page.context());

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
      await setEssentialCookie(page.context());

      await page.setViewportSize({ width, height: 2400 });
      await page.goto(`/publisher/${publisher}`);
      await waitForVisualAssets(page);

      await expect(page).toHaveScreenshot(`${publisher}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}

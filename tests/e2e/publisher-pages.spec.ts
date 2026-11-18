import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route(
    /https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//,
    async (route) => {
      await route.abort();
    },
  );
});

test("trust badges are shown from Store data", async ({ page }) => {
  await page.goto("/publisher/jetbrains");
  await expect(page.getByText("Verified account")).toBeVisible();

  await page.goto("/publisher/snapcrafters");
  await expect(page.getByText("Star developer")).toBeVisible();
});

test("snapcrafters curated page links to publisher search", async ({ page }) => {
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

test("decorative publisher icon is hidden from screen readers", async ({ page }) => {
  await page.goto("/publisher/jetbrains");

  const publisherIcon = page.locator(".p-snap-heading__icon").first();
  await expect(publisherIcon).toHaveAttribute("alt", "");
});



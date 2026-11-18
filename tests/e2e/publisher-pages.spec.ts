import { expect, test } from "@playwright/test";

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
  await seeAllLink.click();

  await expect(page).toHaveURL(/\/search\?q=publisher%3Asnapcrafters$/);
});

test("decorative publisher icon is hidden from screen readers", async ({ page }) => {
  await page.goto("/publisher/jetbrains");

  const publisherIcon = page.locator(".p-snap-heading__icon").first();
  await expect(publisherIcon).toHaveAttribute("alt", "");
});



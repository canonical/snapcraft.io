import { spawn } from "node:child_process";
import {
  access,
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const MAIN_REVISION = "f0ee8c17fd8a8d302e040e284e3b5351c855ea0d";
const SERVER_PORT = 8012;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;

const analyticsRegex =
  /https:\/\/(www\.googletagmanager\.com|www\.google-analytics\.com|analytics\.google\.com|stats\.g\.doubleclick\.net)\//;

const customPublishers = ["jetbrains", "kde", "snapcrafters"];
const htmlPages = [
  "jetbrains",
  "kde",
  "snapcrafters",
  "lukewh",
];
const screenshotViewports = [375, 768, 1280];

const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function waitForVisualAssets(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const images = Array.from(document.images);

    for (const image of images) {
      image.loading = "eager";
      if (image.dataset && image.dataset.src && !image.getAttribute("src")) {
        image.setAttribute("src", image.dataset.src);
      }
    }

    await Promise.race([
      Promise.all(
        images.map(
          (image) =>
            new Promise((resolve) => {
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

    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, delay(5000)]);
    }

    window.scrollTo(0, document.body.scrollHeight);
    await delay(300);
    window.scrollTo(0, 0);
    await delay(300);
  });
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // server not ready yet
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function uniqueInOrder(values) {
  const seen = new Set();
  const ordered = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      ordered.push(value);
    }
  }

  return ordered;
}

async function main() {
  const repoRoot = process.cwd();
  const baselineRoot = path.join(repoRoot, "tests/e2e/fixtures/main-baseline");
  const exportRoot = path.join(
    baselineRoot,
    "source-export",
    MAIN_REVISION,
  );
  const htmlRoot = path.join(baselineRoot, "html");
  const screenshotRoot = path.join(baselineRoot, "screenshots");
  const builtAssetsSource = process.env.BASELINE_ASSETS_SOURCE
    ? path.resolve(repoRoot, process.env.BASELINE_ASSETS_SOURCE)
    : path.join(repoRoot, "static/js/dist/vite");
  const exportBuiltAssets = path.join(exportRoot, "static/js/dist/vite");

  await access(exportRoot);
  await access(builtAssetsSource);
  await mkdir(htmlRoot, { recursive: true });
  await mkdir(screenshotRoot, { recursive: true });

  await rm(exportBuiltAssets, { force: true, recursive: true });
  await mkdir(path.dirname(exportBuiltAssets), { recursive: true });
  await cp(builtAssetsSource, exportBuiltAssets, { recursive: true });

  const fixturePayload = JSON.parse(
    await readFile(
      path.join(baselineRoot, "store-fixtures.json"),
      "utf-8",
    ),
  );

  const server = spawn(
    "python3",
    ["tests/e2e/publisher_server_main_baseline.py", "--port", "8012"],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        SNAPCRAFT_MAIN_EXPORT_ROOT: exportRoot,
        BASELINE_SERVER_PORT: String(SERVER_PORT),
        ENVIRONMENT: "production",
        FLASK_DEBUG: "0",
      },
      stdio: "inherit",
    },
  );

  try {
    await waitForServer(`${BASE_URL}/publisher/jetbrains`);

    const browser = await chromium.launch();

    const observations = {
      mainRevision: MAIN_REVISION,
      capturedAt: new Date().toISOString(),
      axe: {},
      analyticsRequests: {},
      assetRequestFailures: {},
      assetErrorResponses: {},
      snapcraftersCuratedSnapLinks: [],
    };

    // Save four HTML baselines as raw HTTP responses and capture
    // analytics observations through browser navigation.
    for (const pageName of htmlPages) {
      const htmlResponse = await fetch(`${BASE_URL}/publisher/${pageName}`);
      const html = await htmlResponse.text();
      await writeFile(path.join(htmlRoot, `${pageName}.html`), html);

      const context = await browser.newContext({
        viewport: { width: 1280, height: 2400 },
      });
      const page = await context.newPage();
      const analyticsRequests = [];
      const requestFailures = [];
      const errorResponses = [];

      page.on("requestfailed", (request) => {
        requestFailures.push({
          url: request.url(),
          errorText: request.failure()?.errorText || "unknown",
        });
      });

      page.on("response", (response) => {
        if (response.status() >= 400) {
          errorResponses.push({
            url: response.url(),
            status: response.status(),
          });
        }
      });

      await page.route(analyticsRegex, async (route) => {
        analyticsRequests.push(route.request().url());
        await route.abort();
      });

      await page.goto(`${BASE_URL}/publisher/${pageName}`, {
        waitUntil: "domcontentloaded",
      });

      await waitForVisualAssets(page);

      observations.analyticsRequests[pageName] = analyticsRequests;
      observations.assetRequestFailures[pageName] = requestFailures;
      observations.assetErrorResponses[pageName] = errorResponses;

      if (pageName === "snapcrafters") {
        const links = await page.evaluate(() => {
          return Array.from(
            document.querySelectorAll("a.p-media-object--snap"),
          ).map((anchor) => anchor.getAttribute("href") || "");
        });

        observations.snapcraftersCuratedSnapLinks = uniqueInOrder(
          links.filter((href) => /^\/[a-z0-9-]+$/.test(href)),
        );
      }

      await context.close();
    }

    // Save nine screenshots for the three custom pages.
    for (const publisher of customPublishers) {
      observations.axe[publisher] = {};

      for (const width of screenshotViewports) {
        const context = await browser.newContext({
          viewport: { width, height: 2400 },
        });
        const page = await context.newPage();

        await page.route(analyticsRegex, async (route) => {
          await route.abort();
        });

        await page.goto(`${BASE_URL}/publisher/${publisher}`, {
          waitUntil: "domcontentloaded",
        });

        await waitForVisualAssets(page);

        await page.screenshot({
          path: path.join(screenshotRoot, `${publisher}-${width}.png`),
          fullPage: true,
        });

        if (width === 375 || width === 1280) {
          const axeResult = await new AxeBuilder({ page })
            .withTags(axeTags)
            .analyze();

          observations.axe[publisher][width] = {
            violations: axeResult.violations.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              help: violation.help,
              nodes: violation.nodes.length,
            })),
            violationCount: axeResult.violations.length,
          };
        }

        await context.close();
      }
    }

    await browser.close();

    await writeFile(
      path.join(baselineRoot, "provenance.json"),
      `${JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          mainRevision: MAIN_REVISION,
          sourceExportRoot: exportRoot,
          baseUrl: BASE_URL,
          htmlPages,
          customPublishers,
          screenshotViewports,
          axeTags,
        },
        null,
        2,
      )}\n`,
    );

    await writeFile(
      path.join(baselineRoot, "observations.json"),
      `${JSON.stringify(observations, null, 2)}\n`,
    );

    await writeFile(
      path.join(baselineRoot, "store-fixtures.captured.json"),
      `${JSON.stringify(fixturePayload, null, 2)}\n`,
    );
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

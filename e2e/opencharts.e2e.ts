import { expect, test } from "playwright/test";

/**
 * Browser smoke coverage for the public demo. Run with:
 *   npx playwright test e2e/opencharts.e2e.ts --config=e2e/playwright.config.ts
 *
 * The config starts Vite, so this remains independent from the library's
 * package scripts until the browser suite is promoted to CI.
 */
test.describe("OpenCharts demo", () => {
  test("loads without console errors and exposes its chart demos", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /charts that stay out/i })).toBeVisible();
    await expect(page.getByText("Order-book depth", { exact: true })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(3);
    await expect.poll(() => errors, { message: errors.join("\n") }).toEqual([]);
  });

  test("opens an event popup from the main canvas", async ({ page }) => {
    await page.goto("/");
    const mainCanvas = page.locator("#chart canvas");
    await expect(mainCanvas).toBeVisible();

    // Markers are canvas-rendered. Locate the rightmost earnings marker from
    // its public demo colour instead of coupling this regression to a pane
    // height or a particular visible-range calculation.
    const marker = await mainCanvas.evaluate((canvas) => {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("2D canvas context unavailable");
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let x = -1;
      let y = -1;
      for (let py = 0; py < canvas.height; py += 1) {
        for (let px = 0; px < canvas.width; px += 1) {
          const index = (py * canvas.width + px) * 4;
          if (
            pixels[index] === 167 &&
            pixels[index + 1] === 139 &&
            pixels[index + 2] === 250 &&
            px > x
          ) {
            x = px;
            y = py;
          }
        }
      }
      if (x < 0) throw new Error("Earnings marker colour was not rendered");
      const rect = canvas.getBoundingClientRect();
      return { x: (x * rect.width) / canvas.width, y: (y * rect.height) / canvas.height };
    });
    await mainCanvas.click({ position: marker });

    const popup = page.locator("#chart .openchart-event-popup");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("ACME Q4 earnings");
    await expect(popup.getByRole("button", { name: "View earnings" })).toBeVisible();
  });

  test("refreshes the depth snapshot while preserving both depth series", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("#depth-chart canvas");
    await expect(canvas).toBeVisible();

    const before = await canvas.screenshot();
    await page.getByRole("button", { name: "New snapshot" }).click();
    await expect(canvas).toBeVisible();
    const after = await canvas.screenshot();

    // A snapshot uses randomized liquidity levels. A changed canvas ensures
    // the button rerendered new bid and ask step-area data, without snapshot
    // baselines that would make routine visual refinements noisy.
    expect(after.equals(before)).toBe(false);
  });

  test("navigates the numeric depth viewport", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("#depth-chart canvas");
    await expect(canvas).toBeVisible();
    await canvas.hover({ position: { x: 180, y: 120 } });
    const before = await canvas.screenshot();
    await page.mouse.wheel(0, -360);
    await page.waitForTimeout(50);
    expect((await canvas.screenshot()).equals(before)).toBe(false);
  });

  test("renders a standalone custom series without caller-owned OHLC bars", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator("#distribution-chart canvas");
    await expect(canvas).toBeVisible();
    const before = await canvas.screenshot();

    await page.getByRole("button", { name: "Line + area" }).click();
    const after = await canvas.screenshot();

    expect(after.equals(before)).toBe(false);
  });

  test("keeps the public documentation guides and component reference reachable", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto("/docs.html");
    await expect(page.getByRole("heading", { name: "OpenCharts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "3D options surface" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Series & panes" }).first()).toBeVisible();
    await page.getByRole("link", { name: "Getting started" }).first().click();
    await expect(page.getByRole("heading", { name: "Getting started" })).toBeVisible();
    await expect(page.getByText("The host controls chart size.")).toBeVisible();
    await expect.poll(() => errors, { message: errors.join("\n") }).toEqual([]);
  });

  test("renders the live examples gallery", async ({ page }) => {
    await page.goto("/examples.html");
    await expect(page.getByRole("heading", { name: /useful chart patterns/i })).toBeVisible();
    await expect(page.locator(".example-chart canvas, .stream-chart canvas, .option-surface canvas, .monte-carlo-chart canvas")).toHaveCount(10);
    await expect(page.getByRole("button", { name: "Clusters" })).toBeVisible();
    await expect(page.getByText("Order-book depth", { exact: true })).toBeVisible();
    await expect(page.getByText("Multi-leg options payoff", { exact: true })).toBeVisible();
    await expect(page.getByText("Implied-volatility surface", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Clusters" }).click();
    await expect(page.getByText("Three groups with centroids", { exact: true })).toBeVisible();
    await expect(page.getByText("Monte Carlo price paths", { exact: true })).toBeVisible();
    await expect(page.getByText("Options chain & strategy builder", { exact: true })).toBeVisible();
    await expect(page.locator("#example-orderbook .opencharts-orderbook-row").first()).toBeVisible();
    const payoffCanvas = page.locator("#example-payoff canvas");
    const payoffBefore = await payoffCanvas.screenshot();
    await page.locator("#example-options-chain .opencharts-options-row button.buy").first().click();
    await expect(page.locator("#example-options-chain .opencharts-options-legs button")).toHaveCount(1);
    await expect(page.locator("#example-options-chain .calls .opencharts-options-row").first().locator("button.sell")).toBeDisabled();
    expect((await payoffCanvas.screenshot()).equals(payoffBefore)).toBe(false);
    await page.getByRole("button", { name: "ATM ±5" }).click();
    await expect(page.locator("#example-options-chain .opencharts-options-strikes .opencharts-options-row")).toHaveCount(4);
    await page.getByRole("button", { name: "Calls" }).click();
    await expect(page.locator("#example-options-chain .opencharts-options-table")).toHaveClass(/mode-call/);
    await page.locator("#example-options-chain select").selectOption("2026-03-20");
    await expect(page.locator("#example-options-chain .opencharts-options-legs button")).toHaveCount(1);
    await expect(page.locator("#intrabar-status")).toContainText("intrabar updates");
  });

  test("renders visible chart comparisons on the benchmark page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/benchmarks.html");
    await expect(page.locator("#oc canvas")).toBeVisible();
    await expect(page.locator("#lwc canvas").first()).toBeVisible();
    await expect(page.locator("#results")).toContainText("EMA pane", {
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Run benchmark" })).toBeVisible();
    await expect.poll(() => errors, { message: errors.join("\n") }).toEqual([]);
  });

});

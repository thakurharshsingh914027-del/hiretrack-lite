import { expect, test } from "@playwright/test";

test("landing page exposes the product and static documentation", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response).not.toBeNull();
  expect(response?.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Hiring momentum",
  );
  await page.getByRole("link", { name: "Explore the product" }).click();
  await expect(page).toHaveURL(/\/docs\/features$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Product features" }),
  ).toBeVisible();
});

test("anonymous workspace access redirects to sign in", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?callbackUrl=\/app$/);
});

const narrowViewportRoutes = ["/", "/docs/features", "/faq", "/app"] as const;

for (const route of narrowViewportRoutes) {
  test(`${route} does not cause horizontal page overflow at 320 pixels`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(route);

    const sizes = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
  });
}

test("marketing mobile navigation closes after following its links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });

  for (const destination of [
    { name: "Docs", path: "/docs" },
    { name: "Features", path: "/docs/features" },
  ]) {
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();

    const navigation = page.getByRole("dialog", { name: "Navigation" });
    await expect(navigation).toBeVisible();
    await navigation.getByRole("link", { name: destination.name }).click();

    await expect(page).toHaveURL(destination.path);
    await expect(navigation).toBeHidden();
  }
});

test("anonymous deep workspace routes remain protected on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?callbackUrl=\/app$/);
});

test("theme starts from the system preference and can be overridden", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

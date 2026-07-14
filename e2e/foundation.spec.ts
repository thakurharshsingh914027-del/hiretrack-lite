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

test("workspace command palette is keyboard accessible", async ({ page }) => {
  await page.goto("/app");

  const trigger = page.getByRole("button", { name: /Search or jump to/ });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.press("ControlOrMeta+K");

  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Search pages and actions…"),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeHidden();
});

const narrowViewportRoutes = ["/", "/docs/features", "/faq", "/app"];

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

test("workspace mobile navigation closes after navigating to Jobs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/app");
  await page.getByRole("button", { name: "Open workspace navigation" }).click();

  const navigation = page.getByRole("dialog", {
    name: "Workspace navigation",
  });
  await expect(navigation).toBeVisible();
  await navigation.getByRole("link", { name: "Jobs" }).click();

  await expect(page).toHaveURL("/app/jobs");
  await expect(navigation).toBeHidden();
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

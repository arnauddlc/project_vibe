import { expect, test, type Page } from "@playwright/test";

const login = async (page: Page) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
};

test("rejects invalid credentials", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("wrong");
  await page.getByLabel("Password").fill("creds");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});

test("loads the kanban board after login", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Kanban Studio" })).toBeVisible();
  await expect(page.locator('[data-testid^="column-"]')).toHaveCount(5);
});

test("adds a card to a column", async ({ page }) => {
  await login(page);
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  const cardTitle = `Playwright card ${Math.random().toString(36).slice(2, 8)}`;
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill(cardTitle);
  await firstColumn.getByPlaceholder("Details").fill("Added via e2e.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(
    firstColumn.getByRole("heading", { name: cardTitle })
  ).toBeVisible();
});

test("moves a card between columns", async ({ page }) => {
  await login(page);
  const card = page
    .locator('[data-testid^="card-"]')
    .filter({ hasText: "Align roadmap themes" })
    .first();
  const targetColumn = page
    .locator('[data-testid^="column-"]')
    .filter({ hasText: "Review" });
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  await expect(
    targetColumn.getByRole("heading", { name: /align roadmap themes/i })
  ).toBeVisible();
});

test("moves a card into the second column", async ({ page }) => {
  await login(page);
  const card = page
    .locator('[data-testid^="card-"]')
    .filter({ hasText: "Gather customer signals" })
    .first();
  const targetColumn = page
    .locator('[data-testid^="column-"]')
    .filter({
      has: page.locator(
        'input[aria-label="Column title"][value="Discovery"]'
      ),
    });
  const cardBox = await card.boundingBox();
  const columnBox = await targetColumn.boundingBox();
  if (!cardBox || !columnBox) {
    throw new Error("Unable to resolve drag coordinates.");
  }

  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    columnBox.x + columnBox.width / 2,
    columnBox.y + 120,
    { steps: 12 }
  );
  await page.mouse.up();
  await expect(
    targetColumn.getByRole("heading", { name: /gather customer signals/i })
  ).toBeVisible();
});

test("logs out to the login screen", async ({ page }) => {
  await login(page);
  await page.getByTestId("logout-button").click();
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("persists board updates across logout", async ({ page }) => {
  await login(page);
  const firstColumn = page.locator('[data-testid^="column-"]').first();
  const cardTitle = `Persistent card ${Math.random().toString(36).slice(2, 8)}`;
  await firstColumn.getByRole("button", { name: /add a card/i }).click();
  await firstColumn.getByPlaceholder("Card title").fill(cardTitle);
  await firstColumn.getByPlaceholder("Details").fill("Stored locally.");
  await firstColumn.getByRole("button", { name: /add card/i }).click();
  await expect(
    firstColumn.getByRole("heading", { name: cardTitle })
  ).toBeVisible();

  await page.getByTestId("logout-button").click();
  await page.getByLabel("Username").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page.getByRole("heading", { name: cardTitle })).toBeVisible();
});

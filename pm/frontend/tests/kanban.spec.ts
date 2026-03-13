import { expect, test, type Page } from "@playwright/test";
import { initialData } from "../src/lib/kanban";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const buildAiBoard = () => {
  const board = clone(initialData);
  const cardId = "card-ai-1";
  board.cards[cardId] = {
    id: cardId,
    title: "AI follow-up",
    details: "Suggested via chat.",
  };
  board.columns[0].cardIds.push(cardId);
  return board;
};

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

test("uses the AI chat to update the board", async ({ page }) => {
  const aiBoard = buildAiBoard();
  await page.route("**/api/ai/board**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Added a card via AI.",
        board: aiBoard,
        applied: true,
      }),
    });
  });

  await login(page);
  await page.getByTestId("ai-input").fill("Add a follow-up card");
  await page.getByTestId("ai-send").click();

  await expect(page.getByText(/added a card via ai/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "AI follow-up" })
  ).toBeVisible();
});

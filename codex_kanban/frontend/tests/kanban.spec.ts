import { expect, test } from "@playwright/test";

test("board loads with five columns", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Orion Launch Kanban" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Backlog" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Discovery" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Design" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Build" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Review" })).toBeVisible();
});

test("adds a new card to a column", async ({ page }) => {
  await page.goto("/");

  const backlog = page.getByRole("region", { name: "Backlog" });
  await backlog.getByRole("button", { name: "New card" }).click();
  await backlog.getByPlaceholder("Card title").fill("Prepare launch brief");
  await backlog
    .getByPlaceholder("Details (optional)")
    .fill("Draft the internal narrative and release checklist.");
  await backlog.getByRole("button", { name: "Add card" }).click();

  await expect(backlog.getByText("Prepare launch brief")).toBeVisible();
});

test("drags a card between columns", async ({ page }) => {
  await page.goto("/");

  const source = page.locator('[data-card-id="card-1"] .card-grip');
  const target = page.locator('[data-column-id="design"]');

  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Drag source or target not found.");
  }

  await page.mouse.move(
    sourceBox.x + sourceBox.width / 2,
    sourceBox.y + sourceBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 }
  );
  await page.mouse.up();

  const design = page.getByRole("region", { name: "Design" });
  await expect(design.getByText("Map feature scope")).toBeVisible();

  const backlog = page.getByRole("region", { name: "Backlog" });
  await expect(backlog.getByText("Map feature scope")).toHaveCount(0);
});

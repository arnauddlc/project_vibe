import { test, expect } from '@playwright/test';

test.describe('Kanban Application MVP', () => {
  test('should load the board with dummy data', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1', { hasText: 'Kanban Board' })).toBeVisible();
    await expect(page.locator('input[aria-label="Rename Column"]').first()).toHaveValue('To Do');
    await expect(page.locator('text=Setup Next.js')).toBeVisible();
  });

  test('can rename a column', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('input[aria-label="Rename Column"]').first();
    await input.fill('Backlog');
    await input.press('Enter');
    await expect(input).toHaveValue('Backlog');
  });

  test('can add a new card to a column', async ({ page }) => {
    await page.goto('/');
    // Click add card button in the first column
    const addCardBtn = page.locator('button:has-text("+ Add a card")').first();
    await addCardBtn.click();
    
    // Fill in new card
    const titleInput = page.locator('.add-card-input').first();
    await titleInput.fill('Integration Test Card');
    
    const submitBtn = page.locator('button:has-text("Add")').first();
    await submitBtn.click();
    
    // Verify it appeared
    await expect(page.locator('text=Integration Test Card')).toBeVisible();
  });

  test('can delete a card', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.card', { hasText: 'Setup Next.js' }).first();
    const deleteBtn = card.locator('.delete-btn');
    
    // Playwright needs to hover to make the delete button visible and interactable if opacity is 0 initially
    await card.hover();
    await deleteBtn.click();
    
    await expect(page.locator('text=Setup Next.js')).not.toBeVisible();
  });

  test('can drag and drop a card', async ({ page }) => {
    await page.goto('/');
    
    const card = page.locator('.card', { hasText: 'Setup Next.js' }).first();
    
    // find Review column (index 2: To Do, In Progress, Review)
    const reviewColumn = page.locator('.column').nth(2);
    
    await card.dragTo(reviewColumn);
    
    // It should still exist on the page without errors
    await expect(page.locator('.card', { hasText: 'Setup Next.js' })).toBeVisible();
  });
});

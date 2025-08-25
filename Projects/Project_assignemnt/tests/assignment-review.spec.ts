import { test, expect } from '@playwright/test';

test.describe('Assignment Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/dashboard/review-assignments');
    
    // Wait for the component to load
    await page.waitForLoadState('networkidle');
  });

  test('displays AI parsed assignments correctly', async ({ page }) => {
    // Check header
    await expect(page.locator('h2')).toContainText('Review Assignments');
    
    // Check that assignments are displayed
    await expect(page.locator('text=Homework 1: Introduction to Calculus')).toBeVisible();
    await expect(page.locator('text=Quiz 1: Limits and Continuity')).toBeVisible();
    await expect(page.locator('text=Midterm Exam')).toBeVisible();
    await expect(page.locator('text=Final Project: Calculus Applications')).toBeVisible();
    
    // Check stats
    await expect(page.locator('text=4').first()).toBeVisible(); // Total count
  });

  test('allows editing assignment details', async ({ page }) => {
    // Click edit button on first assignment
    await page.locator('button').filter({ hasText: /edit/i }).first().click();
    
    // Check that form fields are visible
    await expect(page.locator('input[value="Homework 1: Introduction to Calculus"]')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Edit the title
    const titleInput = page.locator('input[value="Homework 1: Introduction to Calculus"]');
    await titleInput.clear();
    await titleInput.fill('Updated Homework 1');
    
    // Save changes
    await page.locator('button', { hasText: 'Save Changes' }).click();
    
    // Check that assignment was updated
    await expect(page.locator('text=Updated Homework 1')).toBeVisible();
    await expect(page.locator('text=Edited')).toBeVisible(); // Badge
    
    // Check that stats updated (1 edited)
    await expect(page.locator('text=1').nth(1)).toBeVisible(); // Edited count
  });

  test('validates form fields during editing', async ({ page }) => {
    // Click edit button on first assignment
    await page.locator('button').filter({ hasText: /edit/i }).first().click();
    
    // Clear title field
    const titleInput = page.locator('input[value="Homework 1: Introduction to Calculus"]');
    await titleInput.clear();
    
    // Try to save
    await page.locator('button', { hasText: 'Save Changes' }).click();
    
    // Check for validation error
    await expect(page.locator('text=Assignment title is required')).toBeVisible();
  });

  test('allows adding new assignments', async ({ page }) => {
    // Click add assignment button
    await page.locator('button', { hasText: 'Add Assignment' }).click();
    
    // Should show new assignment in edit mode
    await expect(page.locator('input[value="New Assignment"]')).toBeVisible();
    
    // Fill in details
    const titleInput = page.locator('input[value="New Assignment"]');
    await titleInput.clear();
    await titleInput.fill('Extra Credit Assignment');
    
    // Set due date
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-12-30');
    
    // Save
    await page.locator('button', { hasText: 'Save Changes' }).click();
    
    // Check that new assignment appears
    await expect(page.locator('text=Extra Credit Assignment')).toBeVisible();
    await expect(page.locator('text=New')).toBeVisible(); // Badge
    
    // Check stats updated (5 total, 1 added)
    await expect(page.locator('text=5').first()).toBeVisible(); // Total count
    await expect(page.locator('text=1').nth(2)).toBeVisible(); // Added count
  });

  test('allows deleting assignments with confirmation', async ({ page }) => {
    // Click delete button on first assignment
    await page.locator('button').filter({ hasText: /delete/i }).first().click();
    
    // Check confirmation dialog appears
    await expect(page.locator('text=Delete Assignment?')).toBeVisible();
    await expect(page.locator('text=Are you sure you want to remove "Homework 1: Introduction to Calculus"?')).toBeVisible();
    
    // Confirm deletion
    await page.locator('button', { hasText: 'Delete' }).click();
    
    // Check assignment is removed
    await expect(page.locator('text=Homework 1: Introduction to Calculus')).not.toBeVisible();
    
    // Check stats updated (3 total, 1 removed)
    await expect(page.locator('text=3').first()).toBeVisible(); // Total count
    await expect(page.locator('text=1').nth(3)).toBeVisible(); // Removed count
  });

  test('allows canceling delete operation', async ({ page }) => {
    // Click delete button on first assignment
    await page.locator('button').filter({ hasText: /delete/i }).first().click();
    
    // Check confirmation dialog appears
    await expect(page.locator('text=Delete Assignment?')).toBeVisible();
    
    // Cancel deletion
    await page.locator('button', { hasText: 'Cancel' }).click();
    
    // Check assignment is still there
    await expect(page.locator('text=Homework 1: Introduction to Calculus')).toBeVisible();
    
    // Stats should be unchanged
    await expect(page.locator('text=4').first()).toBeVisible(); // Total count
  });

  test('allows resetting to original assignments', async ({ page }) => {
    // First make some changes
    await page.locator('button', { hasText: 'Add Assignment' }).click();
    await page.locator('button', { hasText: 'Save Changes' }).click();
    
    // Check that reset button appears
    await expect(page.locator('button', { hasText: 'Reset All' })).toBeVisible();
    
    // Click reset
    await page.locator('button', { hasText: 'Reset All' }).click();
    
    // Confirm reset
    await expect(page.locator('text=Reset to Original?')).toBeVisible();
    await page.locator('button', { hasText: 'Reset All Changes' }).click();
    
    // Check back to original state
    await expect(page.locator('text=4').first()).toBeVisible(); // Total count
    await expect(page.locator('text=0').nth(1)).toBeVisible(); // Edited count
    await expect(page.locator('text=0').nth(2)).toBeVisible(); // Added count
  });

  test('displays empty state when all assignments are deleted', async ({ page }) => {
    // Delete all assignments
    const deleteButtons = page.locator('button').filter({ hasText: /delete/i });
    const count = await deleteButtons.count();
    
    for (let i = 0; i < count; i++) {
      await page.locator('button').filter({ hasText: /delete/i }).first().click();
      await page.locator('button', { hasText: 'Delete' }).click();
    }
    
    // Check empty state
    await expect(page.locator('text=No Assignments')).toBeVisible();
    await expect(page.locator('text=Add First Assignment')).toBeVisible();
    
    // Confirm button should be disabled
    await expect(page.locator('button', { hasText: 'Confirm & Save' })).toBeDisabled();
  });

  test('confirms assignments and navigates to dashboard', async ({ page }) => {
    // Mock the navigation
    await page.route('/dashboard', (route) => {
      route.fulfill({
        status: 200,
        body: '<html><body><h1>Dashboard</h1></body></html>',
      });
    });
    
    // Click confirm button
    await page.locator('button', { hasText: 'Confirm & Save' }).click();
    
    // Should show loading state
    await expect(page.locator('text=Saving...')).toBeVisible();
    
    // Should navigate to dashboard after confirmation
    await expect(page).toHaveURL('/dashboard');
  });

  test('cancels and returns to upload page', async ({ page }) => {
    // Mock the navigation
    await page.route('/dashboard/upload-syllabus', (route) => {
      route.fulfill({
        status: 200,
        body: '<html><body><h1>Upload Syllabus</h1></body></html>',
      });
    });
    
    // Click cancel button
    await page.locator('button', { hasText: 'Cancel' }).click();
    
    // Should navigate to upload page
    await expect(page).toHaveURL('/dashboard/upload-syllabus');
  });

  test('maintains responsive design on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 320, height: 568 });
    
    // Check that component still displays correctly
    await expect(page.locator('text=Review Assignments')).toBeVisible();
    await expect(page.locator('text=Homework 1: Introduction to Calculus')).toBeVisible();
    
    // Check that buttons are accessible
    await expect(page.locator('button', { hasText: 'Add Assignment' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Confirm & Save' })).toBeVisible();
    
    // Stats should stack on mobile
    const statsCards = page.locator('[data-testid="stats-card"]');
    if (await statsCards.count() > 0) {
      // Check that cards are stacked vertically (height should be larger than width)
      const firstCard = statsCards.first();
      const box = await firstCard.boundingBox();
      if (box) {
        expect(box.width).toBeLessThan(page.viewportSize()!.width);
      }
    }
  });

  test('shows proper accessibility attributes', async ({ page }) => {
    // Check that form fields have proper labels
    await page.locator('button').filter({ hasText: /edit/i }).first().click();
    
    await expect(page.locator('input[aria-label="Assignment Title"], label:has-text("Assignment Title") + input')).toBeVisible();
    await expect(page.locator('input[aria-label="Due Date"], label:has-text("Due Date") + input')).toBeVisible();
    
    // Check that buttons have proper text or aria-labels
    const editButtons = page.locator('button').filter({ hasText: /edit/i });
    await expect(editButtons.first()).toBeVisible();
    
    // Check that dialog has proper attributes
    await page.locator('button').filter({ hasText: /delete/i }).first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });
});
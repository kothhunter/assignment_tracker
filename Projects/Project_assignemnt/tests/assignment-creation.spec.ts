import { test, expect } from '@playwright/test';

test.describe('Assignment Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth page and login (assuming we have a test user)
    await page.goto('/auth');
    
    // Login with test credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should create a new assignment successfully', async ({ page }) => {
    // First, ensure we have at least one class by navigating to classes page
    await page.click('text=Manage Classes');
    await page.waitForURL('/classes');
    
    // Create a class if none exist
    const hasClasses = await page.locator('[data-testid="class-card"]').count();
    if (hasClasses === 0) {
      await page.click('text=Add New Class');
      await page.fill('[data-testid="class-name-input"]', 'Test Class 101');
      await page.click('[data-testid="create-class-button"]');
      await page.waitForSelector('text=Test Class 101');
    }
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    
    // Click the Add Assignment button
    await page.click('text=Add Assignment');
    
    // Verify the dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Assignment')).toBeVisible();
    
    // Fill out the assignment form
    await page.fill('[data-testid="assignment-title-input"]', 'Test Assignment');
    
    // Select a class
    await page.click('[data-testid="class-select"]');
    await page.click('text=Test Class 101');
    
    // Set due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateString = tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
    await page.fill('[data-testid="due-date-input"]', dueDateString);
    
    // Submit the form
    await page.click('text=Create Assignment');
    
    // Verify success toast appears
    await expect(page.locator('text=Assignment created successfully!')).toBeVisible();
    
    // Verify the dialog closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    // Verify the assignment appears in the dashboard
    await expect(page.locator('text=Test Assignment')).toBeVisible();
    await expect(page.locator('text=Test Class 101')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click the Add Assignment button
    await page.click('text=Add Assignment');
    
    // Try to submit without filling required fields
    await page.click('text=Create Assignment');
    
    // Verify validation errors appear
    await expect(page.locator('text=Assignment title is required')).toBeVisible();
    await expect(page.locator('text=Please select a class')).toBeVisible();
    await expect(page.locator('text=Due date is required')).toBeVisible();
  });

  test('should show no classes available when user has no classes', async ({ page }) => {
    // Ensure user has no classes by deleting any existing ones
    await page.click('text=Manage Classes');
    await page.waitForURL('/classes');
    
    // Delete all existing classes
    const classCount = await page.locator('[data-testid="delete-class-button"]').count();
    for (let i = 0; i < classCount; i++) {
      await page.click('[data-testid="delete-class-button"]').nth(0);
      await page.click('text=Delete'); // Confirm deletion
    }
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    
    // Click the Add Assignment button
    await page.click('text=Add Assignment');
    
    // Open class dropdown
    await page.click('[data-testid="class-select"]');
    
    // Verify no classes message
    await expect(page.locator('text=No classes available')).toBeVisible();
  });

  test('should display assignments sorted by due date', async ({ page }) => {
    // Create multiple assignments with different due dates
    const assignments = [
      { title: 'Assignment A', days: 3 },
      { title: 'Assignment B', days: 1 },
      { title: 'Assignment C', days: 2 },
    ];

    for (const assignment of assignments) {
      await page.click('text=Add Assignment');
      
      await page.fill('[data-testid="assignment-title-input"]', assignment.title);
      await page.click('[data-testid="class-select"]');
      await page.click('text=Test Class 101');
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + assignment.days);
      const dueDateString = dueDate.toISOString().slice(0, 16);
      await page.fill('[data-testid="due-date-input"]', dueDateString);
      
      await page.click('text=Create Assignment');
      await page.waitForSelector('text=Assignment created successfully!');
    }
    
    // Verify assignments are displayed in chronological order (earliest due date first)
    const assignmentCards = page.locator('[data-testid="assignment-card"]');
    await expect(assignmentCards.nth(0)).toContainText('Assignment B'); // Due in 1 day
    await expect(assignmentCards.nth(1)).toContainText('Assignment C'); // Due in 2 days
    await expect(assignmentCards.nth(2)).toContainText('Assignment A'); // Due in 3 days
  });

  test('should handle form submission errors gracefully', async ({ page }) => {
    // Mock network failure for assignment creation
    await page.route('**/api/trpc/assignment.createManual*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.click('text=Add Assignment');
    
    await page.fill('[data-testid="assignment-title-input"]', 'Test Assignment');
    await page.click('[data-testid="class-select"]');
    await page.click('text=Test Class 101');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('[data-testid="due-date-input"]', dueDateString);
    
    await page.click('text=Create Assignment');
    
    // Verify error toast appears
    await expect(page.locator('text=Failed to create assignment')).toBeVisible();
    
    // Verify dialog remains open so user can retry
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify dashboard loads properly on mobile
    await expect(page.locator('text=Assignment Tracker')).toBeVisible();
    
    // Click Add Assignment button
    await page.click('text=Add Assignment');
    
    // Verify dialog is properly sized for mobile
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Verify form elements are accessible on mobile
    await expect(page.locator('[data-testid="assignment-title-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="class-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="due-date-input"]')).toBeVisible();
  });

  test('should prevent unauthorized access', async ({ page }) => {
    // Logout first
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/auth');
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    
    // Should be redirected to auth or see access denied message
    await expect(page.locator('text=Access denied')).toBeVisible();
  });
});
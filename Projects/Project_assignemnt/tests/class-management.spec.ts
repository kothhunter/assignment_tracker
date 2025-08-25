import { test, expect } from '@playwright/test';

test.describe('Class Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the classes page before each test
    await page.goto('/classes');
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users to auth page', async ({ page }) => {
      // Should be redirected to auth page
      await expect(page).toHaveURL(/\/auth/);
      await expect(page.getByText('Sign in to your account')).toBeVisible();
    });

    test('should preserve redirect parameter for classes page', async ({ page }) => {
      // Should be redirected to auth page with redirect parameter
      await expect(page).toHaveURL(/\/auth\?redirect=%2Fclasses/);
    });
  });

  test.describe('Class Management Interface', () => {
    // Note: These tests would require authentication setup
    // For demo purposes, showing the test structure
    
    test('should display class management page header', async ({ page }) => {
      // Skip if not authenticated for demo
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await expect(page.getByText('Class Management')).toBeVisible();
      await expect(page.getByText(/Organize your classes/)).toBeVisible();
    });

    test('should show empty state when no classes exist', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await expect(page.getByText('No classes yet')).toBeVisible();
      await expect(page.getByText(/Create your first class/)).toBeVisible();
      await expect(page.getByRole('button', { name: /create your first class/i })).toBeVisible();
    });

    test('should open create form when create button is clicked', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /create your first class/i }).click();
      
      await expect(page.getByText('Create New Class')).toBeVisible();
      await expect(page.getByLabel(/class name/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create class/i })).toBeVisible();
    });

    test('should validate class name is required', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /create your first class/i }).click();
      await page.getByRole('button', { name: /create class/i }).click();
      
      await expect(page.getByText('Class name is required')).toBeVisible();
    });

    test('should create a new class successfully', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      const className = 'MATH 113 - Calculus I';
      
      await page.getByRole('button', { name: /create your first class/i }).click();
      await page.getByLabel(/class name/i).fill(className);
      await page.getByRole('button', { name: /create class/i }).click();
      
      // Should show success message
      await expect(page.getByText('Class created successfully')).toBeVisible();
      
      // Should show the new class in the list with counts
      await expect(page.getByText(className)).toBeVisible();
      await expect(page.getByText('0 done')).toBeVisible();
      await expect(page.getByText('0 left')).toBeVisible();
    });

    test('should display class list with multiple classes', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      // Assuming classes exist
      await expect(page.getByText('Your Classes')).toBeVisible();
      await expect(page.getByText(/\d+ class(es)?/)).toBeVisible();
      await expect(page.getByRole('button', { name: /add class/i })).toBeVisible();
    });

    test('should open edit form when edit is clicked', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      // Click on menu button for first class (assuming it exists)
      await page.locator('[data-testid="class-menu"]').first().click();
      await page.getByText('Edit').click();
      
      await expect(page.getByText('Edit Class')).toBeVisible();
      await expect(page.getByLabel(/class name/i)).toHaveValue(/.*\w.*/);
      await expect(page.getByRole('button', { name: /update class/i })).toBeVisible();
    });

    test('should update class name successfully', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      const newClassName = 'MATH 114 - Calculus II';
      
      await page.locator('[data-testid="class-menu"]').first().click();
      await page.getByText('Edit').click();
      
      await page.getByLabel(/class name/i).clear();
      await page.getByLabel(/class name/i).fill(newClassName);
      await page.getByRole('button', { name: /update class/i }).click();
      
      await expect(page.getByText('Class updated successfully')).toBeVisible();
      await expect(page.getByText(newClassName)).toBeVisible();
    });

    test('should show delete confirmation dialog', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.locator('[data-testid="class-menu"]').first().click();
      await page.getByText('Delete').click();
      
      await expect(page.getByText('Delete Class')).toBeVisible();
      await expect(page.getByText(/Are you sure you want to delete/)).toBeVisible();
      await expect(page.getByText(/This action cannot be undone/)).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete class/i })).toBeVisible();
    });

    test('should cancel delete operation', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.locator('[data-testid="class-menu"]').first().click();
      await page.getByText('Delete').click();
      await page.getByRole('button', { name: /cancel/i }).click();
      
      // Dialog should be closed
      await expect(page.getByText('Delete Class')).not.toBeVisible();
    });

    test('should delete class successfully', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      const classToDelete = await page.locator('[data-testid="class-card"]').first().textContent();
      
      await page.locator('[data-testid="class-menu"]').first().click();
      await page.getByText('Delete').click();
      await page.getByRole('button', { name: /delete class/i }).click();
      
      await expect(page.getByText('Class deleted successfully')).toBeVisible();
      if (classToDelete) {
        await expect(page.getByText(classToDelete)).not.toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to dashboard from classes page', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /back to dashboard/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText('Assignment Tracker')).toBeVisible();
    });

    test('should navigate to classes from dashboard', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.goto('/dashboard');
      await page.getByRole('button', { name: /manage classes/i }).click();
      
      await expect(page).toHaveURL(/\/classes/);
      await expect(page.getByText('Class Management')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that the page is responsive
      const header = page.locator('header').first();
      if (await header.isVisible()) {
        const boundingBox = await header.boundingBox();
        expect(boundingBox?.width).toBeLessThanOrEqual(375);
      }
    });

    test('should display classes in grid on desktop', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Should show grid layout for classes
      const classGrid = page.locator('.grid');
      if (await classGrid.isVisible()) {
        await expect(classGrid).toHaveClass(/md:grid-cols-2|lg:grid-cols-3/);
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should prevent duplicate class names', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      const duplicateName = 'MATH 113 - Calculus I';
      
      // Assuming this class already exists
      await page.getByRole('button', { name: /add class/i }).click();
      await page.getByLabel(/class name/i).fill(duplicateName);
      await page.getByRole('button', { name: /create class/i }).click();
      
      await expect(page.getByText('A class with this name already exists')).toBeVisible();
    });

    test('should trim whitespace from class names', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      const className = '  PHYS 101 - Physics I  ';
      const trimmedName = 'PHYS 101 - Physics I';
      
      await page.getByRole('button', { name: /add class/i }).click();
      await page.getByLabel(/class name/i).fill(className);
      await page.getByRole('button', { name: /create class/i }).click();
      
      await expect(page.getByText('Class created successfully')).toBeVisible();
      await expect(page.getByText(trimmedName)).toBeVisible();
    });

    test('should enforce maximum length for class names', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /add class/i }).click();
      
      const input = page.getByLabel(/class name/i);
      await expect(input).toHaveAttribute('maxlength', '255');
    });
  });

  test.describe('Toast Notifications', () => {
    test('should show success toast when class is created', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /add class/i }).click();
      await page.getByLabel(/class name/i).fill('CS 101 - Computer Science');
      await page.getByRole('button', { name: /create class/i }).click();
      
      await expect(page.getByText('Class created successfully')).toBeVisible();
    });

    test('should show error toast when creation fails', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      // Trigger an error (e.g., duplicate name)
      await page.getByRole('button', { name: /add class/i }).click();
      await page.getByLabel(/class name/i).fill('Duplicate Class Name');
      await page.getByRole('button', { name: /create class/i }).click();
      
      // Should show error message
      await expect(page.locator('[data-sonner-toast]')).toContainText(/error|failed/i);
    });
  });

  test.describe('Loading States', () => {
    test('should show loading state during class creation', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      await page.getByRole('button', { name: /add class/i }).click();
      await page.getByLabel(/class name/i).fill('Loading Test Class');
      
      const submitButton = page.getByRole('button', { name: /create class/i });
      await submitButton.click();
      
      // Should briefly show loading state
      await expect(page.getByText('Saving...')).toBeVisible();
    });

    test('should show loading skeletons when page loads', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_USER, 'Authentication required');
      
      // Check for loading skeletons on initial page load
      const skeletons = page.locator('.animate-pulse');
      if (await skeletons.first().isVisible()) {
        await expect(skeletons).toHaveCount(3);
      }
    });
  });
});
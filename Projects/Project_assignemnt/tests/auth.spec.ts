import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page before each test
    await page.goto('/auth');
  });

  test.describe('Login Flow', () => {
    test('should display login form by default', async ({ page }) => {
      await expect(page.getByText('Sign in to your account')).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByLabel(/password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });

    test('should validate password length', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('123');
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await expect(page.getByText('Password must be at least 6 characters')).toBeVisible();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('password123');
      
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await submitButton.click();
      
      await expect(page.getByText('Signing in...')).toBeVisible();
    });
  });

  test.describe('Signup Flow', () => {
    test('should switch to signup form', async ({ page }) => {
      await page.getByText(/don't have an account\? sign up/i).click();
      
      await expect(page.getByText('Create your account')).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByLabel('Confirm Password')).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.getByText(/don't have an account\? sign up/i).click();
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('weak');
      await page.getByLabel('Confirm Password').fill('weak');
      await page.getByRole('button', { name: /create account/i }).click();
      
      await expect(page.getByText(/password must contain at least one uppercase letter/i)).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.getByText(/don't have an account\? sign up/i).click();
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('Password123');
      await page.getByLabel('Confirm Password').fill('Password456');
      await page.getByRole('button', { name: /create account/i }).click();
      
      await expect(page.getByText(/passwords don't match/i)).toBeVisible();
    });

    test('should show loading state during signup', async ({ page }) => {
      await page.getByText(/don't have an account\? sign up/i).click();
      
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel('Password').fill('Password123');
      await page.getByLabel('Confirm Password').fill('Password123');
      
      const submitButton = page.getByRole('button', { name: /create account/i });
      await submitButton.click();
      
      await expect(page.getByText('Creating account...')).toBeVisible();
    });
  });

  test.describe('Form Navigation', () => {
    test('should switch between login and signup forms', async ({ page }) => {
      // Start with login form
      await expect(page.getByText('Sign in to your account')).toBeVisible();
      
      // Switch to signup
      await page.getByText(/don't have an account\? sign up/i).click();
      await expect(page.getByText('Create your account')).toBeVisible();
      
      // Switch back to login
      await page.getByText(/already have an account\? sign in/i).click();
      await expect(page.getByText('Sign in to your account')).toBeVisible();
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users to auth page', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should be redirected to auth page
      await expect(page).toHaveURL(/\/auth/);
      await expect(page.getByText('Sign in to your account')).toBeVisible();
    });

    test('should preserve redirect parameter in URL', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should be redirected to auth page with redirect parameter
      await expect(page).toHaveURL(/\/auth\?redirect=%2Fdashboard/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await expect(page.getByText('Sign in to your account')).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      
      // Check that form is properly sized on mobile
      const form = page.locator('form').first();
      const boundingBox = await form.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
    });

    test('should display correctly on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.getByText('Sign in to your account')).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels and ARIA attributes', async ({ page }) => {
      // Check that all form inputs have proper labels
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      
      // Check form submission button
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/email/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/password/i)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
    });
  });
});
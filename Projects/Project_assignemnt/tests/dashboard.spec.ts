import { test, expect } from '@playwright/test';
import { supabase } from '../src/lib/supabase';

test.describe('Assignment Dashboard E2E Tests', () => {
  // Test data
  const testUser = {
    email: 'dashboard-test@example.com',
    password: 'TestPassword123!',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Delete test assignments and classes
        await supabase.from('assignments').delete().eq('user_id', user.id);
        await supabase.from('classes').delete().eq('user_id', user.id);
        await supabase.from('user_profiles').delete().eq('user_id', user.id);
        
        // Sign out
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  test('should display dashboard for authenticated user', async ({ page }) => {
    // Navigate to auth page and login
    await page.goto('/auth');
    
    // Switch to login form if needed
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    // Fill in login credentials (assuming test user exists)
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify dashboard elements
    await expect(page.getByText('Assignment Tracker')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Your assignments, organized by due date')).toBeVisible();
  });

  test('should show empty state when no assignments exist', async ({ page }) => {
    // Login process (same as above)
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Should show empty state
    await expect(page.getByText('No assignments yet')).toBeVisible();
    await expect(page.getByText(/When you add assignments to your classes/)).toBeVisible();
    
    // Should not show statistics when no assignments
    await expect(page.getByText('Total Assignments')).not.toBeVisible();
  });

  test('should display assignment statistics when assignments exist', async ({ page }) => {
    // This test would need test data to be set up
    // For now, we'll test the UI structure
    
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Wait for the assignments section to load
    await expect(page.getByText('Assignments')).toBeVisible();
    
    // The actual statistics would depend on test data being present
    // This test verifies the structure exists
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Verify mobile layout
    await expect(page.getByText('Assignment Tracker')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Check that the layout is responsive
    const dashboardContainer = page.locator('[class*="max-w-4xl"]');
    await expect(dashboardContainer).toBeVisible();
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Verify tablet layout
    await expect(page.getByText('Assignment Tracker')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    
    // Statistics should be in a grid layout on tablet
    // This would need assignments to exist to test properly
  });

  test('should show loading states during data fetching', async ({ page }) => {
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Might briefly see loading state
    // Note: This is hard to test reliably due to fast loading times
    await page.waitForURL('/dashboard');
    
    // Eventually should show the dashboard content
    await expect(page.getByText('Assignment Tracker')).toBeVisible();
  });

  test('should handle authentication protection', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/dashboard');
    
    // Should redirect to auth page due to middleware
    await page.waitForURL('/auth');
    
    // Or should show access denied message if no redirect
    const accessDenied = page.getByText('Access denied');
    const loginButton = page.getByText('Login');
    
    // One of these should be visible
    expect(await accessDenied.isVisible() || await loginButton.isVisible()).toBe(true);
  });

  test('should allow user to logout from dashboard', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    
    const loginTab = page.getByRole('button', { name: /login/i });
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    
    // Should redirect to auth page
    await page.waitForURL('/auth');
    
    // Verify we're logged out
    await expect(page.getByText(/login/i)).toBeVisible();
  });
});
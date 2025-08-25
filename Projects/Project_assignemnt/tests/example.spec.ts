import { test, expect } from '@playwright/test';

test('homepage has title and welcome message', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Assignment Tracker/);

  // Expect the main heading to be visible
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Assignment Tracker');

  // Expect the welcome message to be visible
  await expect(page.getByText('Welcome to your AI-powered assignment management system')).toBeVisible();
});

test('auth page is accessible', async ({ page }) => {
  await page.goto('/auth');

  // Expect the auth page to load
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Sign in to your account');
  
  // Expect form elements to be present
  await expect(page.getByPlaceholder('Email address')).toBeVisible();
  await expect(page.getByPlaceholder('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
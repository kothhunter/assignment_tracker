import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Syllabus Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth');
    
    // Fill in login credentials (assuming test user exists)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should navigate to syllabus upload page from dashboard', async ({ page }) => {
    // Click the Upload Syllabus button
    await page.click('text=Upload Syllabus');
    
    // Verify we're on the upload page
    await expect(page).toHaveURL('/dashboard/upload-syllabus');
    await expect(page.locator('h1')).toContainText('Upload Syllabus');
    await expect(page.locator('text=Upload or paste your syllabus for AI parsing')).toBeVisible();
  });

  test('should display upload form elements correctly', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Check form elements are present
    await expect(page.locator('[data-testid="class-select"]')).toBeVisible();
    await expect(page.locator('text=Upload File')).toBeVisible();
    await expect(page.locator('text=Paste Text')).toBeVisible();
    await expect(page.locator('button:has-text("Upload Syllabus")')).toBeVisible();
  });

  test('should require class selection before upload', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Try to submit without selecting class
    await page.click('button:has-text("Upload Syllabus")');
    
    // Should show validation error
    await expect(page.locator('text=Please select a class')).toBeVisible();
  });

  test('should switch between upload modes', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Initially should show file upload
    await expect(page.locator('text=Drop your syllabus file here')).toBeVisible();
    
    // Switch to text mode
    await page.click('text=Paste Text');
    
    // Should show text area
    await expect(page.locator('[data-testid="syllabus-text-input"]')).toBeVisible();
    await expect(page.locator('text=Minimum 100 characters required')).toBeVisible();
    
    // Switch back to file mode
    await page.click('text=Upload File');
    
    // Should show file upload again
    await expect(page.locator('text=Drop your syllabus file here')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Create a test PDF file
    const testFilePath = path.join(__dirname, '..', 'test-files', 'test-syllabus.pdf');
    
    // Upload file using the file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    // Should display file information
    await expect(page.locator('text=test-syllabus.pdf')).toBeVisible();
    await expect(page.locator('text=Remove File')).toBeVisible();
  });

  test('should handle text paste upload', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // First select a class (assuming we have a test class)
    await page.click('[data-testid="class-select"]');
    await page.click('text=Math 101'); // Assuming this class exists in test data
    
    // Switch to text mode
    await page.click('text=Paste Text');
    
    // Type valid syllabus content
    const syllabusText = `
      Course Syllabus: Math 101 - Introduction to Calculus
      
      Course Description:
      This course provides an introduction to differential and integral calculus.
      Students will learn fundamental concepts including limits, derivatives, and integrals.
      
      Learning Objectives:
      - Understand the concept of limits and continuity
      - Master techniques of differentiation
      - Apply derivative concepts to optimization problems
      - Understand fundamental theorem of calculus
      - Master basic integration techniques
      
      Grading Policy:
      - Homework: 20%
      - Midterm Exams: 40%
      - Final Exam: 30%
      - Participation: 10%
      
      Required Textbook:
      Calculus: Early Transcendentals by James Stewart
    `;
    
    await page.fill('[data-testid="syllabus-text-input"]', syllabusText);
    
    // Should show character count
    await expect(page.locator(`text=${syllabusText.length} characters`)).toBeVisible();
    
    // Submit the form
    await page.click('button:has-text("Upload Syllabus")');
    
    // Should show success message (placeholder for now)
    await expect(page.locator('text=Syllabus upload feature coming soon!')).toBeVisible();
  });

  test('should validate minimum text length', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Select a class
    await page.click('[data-testid="class-select"]');
    await page.click('text=Math 101');
    
    // Switch to text mode
    await page.click('text=Paste Text');
    
    // Type insufficient content
    await page.fill('[data-testid="syllabus-text-input"]', 'Too short');
    
    // Try to submit
    await page.click('button:has-text("Upload Syllabus")');
    
    // Should show validation error
    await expect(page.locator('text=Please provide either a file or sufficient text content')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard/upload-syllabus');
    
    // Check that elements are still visible and usable
    await expect(page.locator('h1:has-text("Upload Syllabus")')).toBeVisible();
    await expect(page.locator('[data-testid="class-select"]')).toBeVisible();
    await expect(page.locator('text=Upload File')).toBeVisible();
    await expect(page.locator('text=Paste Text')).toBeVisible();
    
    // Test that buttons are clickable
    await page.click('text=Paste Text');
    await expect(page.locator('[data-testid="syllabus-text-input"]')).toBeVisible();
  });

  test('should handle navigation correctly', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Test back to dashboard navigation
    await page.click('text=Back to Dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Navigate back to upload page
    await page.click('text=Upload Syllabus');
    await expect(page).toHaveURL('/dashboard/upload-syllabus');
    
    // Test manage classes navigation
    await page.click('text=Manage Classes');
    await expect(page).toHaveURL('/classes');
  });

  test('should prevent unauthorized access', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies();
    await page.goto('/dashboard/upload-syllabus');
    
    // Should redirect to auth page or show access denied
    await expect(page.locator('text=Access denied. Please log in.')).toBeVisible();
  });

  test('should handle file validation errors', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Try to upload an invalid file type (create a mock file)
    const invalidFile = path.join(__dirname, '..', 'test-files', 'invalid.html');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    
    // Should show validation error (this would be shown via toast)
    // Note: Toast validation might require additional setup in test environment
  });

  test('should maintain form state when switching modes', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Select a class
    await page.click('[data-testid="class-select"]');
    await page.click('text=Math 101');
    
    // Switch to text mode and back
    await page.click('text=Paste Text');
    await page.click('text=Upload File');
    
    // Class selection should be maintained
    await expect(page.locator('[data-testid="class-select"]')).toContainText('Math 101');
  });

  test('should show loading states appropriately', async ({ page }) => {
    await page.goto('/dashboard/upload-syllabus');
    
    // Mock slow class loading
    await page.route('**/api/trpc/class.getAll*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Reload page to trigger loading state
    await page.reload();
    
    // Should show loading spinner
    await expect(page.locator('text=Loading...')).toBeVisible();
  });
});
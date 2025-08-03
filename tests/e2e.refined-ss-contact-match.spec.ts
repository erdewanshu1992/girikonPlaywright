import { test, expect, Page } from "@playwright/test";
import { readExpectedPhonesFromCSV } from '../utils/csvReader.ts';
import path from 'path';
import { existsSync } from 'fs';

// Define the path to your CSV file
const CSV_FILE_PATH = 'expected-numbers.csv';

// Global variable to store the expected phone numbers
let expectedPhones: string[];

// Load expected phone numbers once before any tests run
test.beforeAll(() => {
  if (!existsSync(CSV_FILE_PATH)) {
    throw new Error(`CSV file not found at: ${CSV_FILE_PATH}. Please check the path.`);
  }

  // The csvReader must be the correct one from our previous discussion
  // readExpectedPhonesFromCSV is the correct function name.
  expectedPhones = readExpectedPhonesFromCSV(CSV_FILE_PATH);
  if (expectedPhones.length === 0) {
    throw new Error(`Expected phone numbers list is empty. Please check the CSV file at ${CSV_FILE_PATH}.`);
  }
  console.log(`📁 Reading CSV from: ${CSV_FILE_PATH}`);
  console.log(`Loaded ${expectedPhones.length} expected phone numbers from CSV.`);
});

// Function to handle the cookie notice pop-up
async function handleCookieNotice(page: Page) {
    // Check if the cookie notice is visible
    const cookieNotice = page.locator('.cookieNotice.open');
    if (await cookieNotice.isVisible()) {
        const noticeText = await page.locator('.cookieNotice .col-md-11').innerText();
        console.log(`🍪 Found cookie notice with text: "${noticeText}"`);

        // Click the "Got It" button
        await page.getByRole('button', { name: 'Got It' }).click();
        
        // Wait for the notice to disappear to confirm the action
        await expect(cookieNotice).not.toBeVisible();
        console.log('🍪 Successfully clicked "Got It" and closed the cookie notice.');
    }
}

/**
 * Utility function to clean a string to extract only the phone number part.
 * It looks for a '+' sign and then keeps only digits from that point on.
 * @param phoneString The raw string containing the phone number.
 * @returns The cleaned phone number string, or an empty string if no valid number is found.
 */
function cleanPhoneNumber(phoneString: string): string {
  const plusIndex = phoneString.indexOf('+');
  if (plusIndex === -1) {
    return '';
  }
  let onlyPhone = phoneString.substring(plusIndex);
  return onlyPhone.replace(/[^0-9+]/g, '');
}

/**
 * Utility function to extract and clean phone numbers from a given page based on selectors.
 * @param page The Playwright Page object.
 * @param selectors An array of CSS selectors to find phone number elements.
 * @returns A promise that resolves to an array of unique, cleaned phone numbers.
 */
async function extractPhoneNumbers(page: Page, selectors: string[]): Promise<string[]> {
  const extractedNumbers: Set<string> = new Set();
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'attached' });
    } catch (e) {
      console.warn(`Selector "${selector}" not found on the page, skipping extraction.`);
      continue;
    }

    const elements = await page.$$(selector);
    for (const el of elements) {
      const text = await el.innerText();
      if (text.includes('+')) {
        const cleanedNumber = cleanPhoneNumber(text);
        if (cleanedNumber) {
          extractedNumbers.add(cleanedNumber);
        }
      }
    }
  }

  return Array.from(extractedNumbers);
}

test.describe.parallel("E2E Tests", () => {
    test("should load the homepage", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Girikon/);
        await handleCookieNotice(page);
    });

    const headerData = [
        { name: "Company", linkText: "About Us", expectedURL: /about-us/ },
        { name: "Services", linkText: "Salesforce Consulting Services", expectedURL: /salesforce-consulting-services/ },
        { name: "AI Services", linkText: "Salesforce AI Services", expectedURL: /ai-services/ },
        { name: "Products", linkText: "Salesforce Apps", expectedURL: /apps/ },
        { name: "Industries", linkText: "Energy / Utilities", expectedURL: /energy-utilities/ },
    ];

    for (const header of headerData) {
        test(`should navigate to ${header.name} header through the hover action`, async ({ page }) => {
            await page.goto("/");
            
            const headerLocator = page.locator(`span[data-hover="${header.name}"]`).filter({ hasText: header.name }).last();
            await expect(headerLocator).toBeVisible();
            await headerLocator.hover();

            const screenshotPath = path.join(__dirname, '..', 'screenshots', `${header.name.toLowerCase().replace(/\s+/g, '-')}-hover.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Full page screenshot taken: ${screenshotPath}`);

            const parentLi = headerLocator.locator('xpath=ancestor::li');
            const subLink = parentLi.getByRole('link', { name: header.linkText, exact: true });

            await expect(subLink).toBeVisible();
            await subLink.scrollIntoViewIfNeeded();
            await subLink.click();
            await expect(page).toHaveURL(header.expectedURL);
            await page.goBack();
            await expect(page).toHaveURL("/");
        });
    }

    test('should navigate the career page', async ({ page }) => {
        await page.goto("/");
        await page.getByRole('link', { name: 'Career Career' }).click();
        await expect(page).toHaveURL(/career/);
        await page.goBack();
        await expect(page).toHaveURL("/");
    });

    // Integrated and refined phone number validation test
    test('Validate phone numbers on homepage and contact page against CSV', async ({ page }) => {
        // Handle cookie notice at the start of the test if needed
        await page.goto("/");
        await handleCookieNotice(page);
      
        // 1. Validate homepage phone numbers
        console.log('Validating homepage phone numbers...');
        const homePageSelectors = ['a[href^="tel:"]'];
        const homePagePhones = await extractPhoneNumbers(page, homePageSelectors);
        console.log(`📞 Found ${homePagePhones.length} phone numbers on homepage:`, homePagePhones);
        
        for (const phone of homePagePhones) {
          expect(expectedPhones, `Phone number "${phone}" from homepage is not in the CSV file.`).toContain(phone);
        }
      
        // 2. Navigate to and validate contact page phone numbers
        console.log('Navigating to contact page...');
        await page.getByRole('link', { name: 'Contact Us Contact Us' }).click(); // Use the working selector
        await expect(page).toHaveURL(/contact-us/);
        
        const contactPageSelectors = ['span.pra-medium.pra-medium-font'];
        const contactPagePhones = await extractPhoneNumbers(page, contactPageSelectors);
        console.log(`📞 Found ${contactPagePhones.length} phone numbers on contact page:`, contactPagePhones);
      
        for (const phone of contactPagePhones) {
          expect(expectedPhones, `Phone number "${phone}" from contact page is not in the CSV file.`).toContain(phone);
        }
      
        // 3. (Optional but recommended) Validate that all numbers from the CSV are on the site
        console.log('Validating that all CSV numbers are present on the site...');
        const allExtractedPhones = new Set([...homePagePhones, ...contactPagePhones]);
        
        for (const expectedPhone of expectedPhones) {
          const isPresent = Array.from(allExtractedPhones).some(extractedPhone => extractedPhone.includes(expectedPhone));
          expect(isPresent, `Expected phone number "${expectedPhone}" from CSV is not found on either homepage or contact page.`).toBeTruthy();
        }
        await page.goBack();
        await expect(page).toHaveURL("/");
    });

    // Removed the duplicate and less robust test for phone number validation
    // test('should match contact numbers with CSV (Refined)', async ({ page }) => { ... });
});
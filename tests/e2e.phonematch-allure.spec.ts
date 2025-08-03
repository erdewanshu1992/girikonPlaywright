// In your test file, e.g., tests/e2e.phonematch.spec.ts

import { test, expect, Page } from '@playwright/test';
import { readExpectedPhonesFromCSV } from '../utils/csvReader';
import { existsSync } from 'fs';
import { allure } from "allure-playwright";

const CSV_FILE_PATH = 'expected-numbers.csv';

let expectedPhones: string[];

// FIX: Correctly structure the test.beforeAll call.
// The fixtures object `{}` is part of the callback function's signature.
test.beforeAll(async ({}) => {
  await test.step('Set up test data from CSV', async () => {
    if (!existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}. Please check the path.`);
    }

    expectedPhones = readExpectedPhonesFromCSV(CSV_FILE_PATH);
    if (expectedPhones.length === 0) {
      throw new Error(`Expected phone numbers list is empty. Please check the CSV file at ${CSV_FILE_PATH}.`);
    }

    const csvContent = JSON.stringify(expectedPhones, null, 2);
    await allure.attachment('Expected Phones from CSV', csvContent, 'application/json');
    console.log(`📁 Reading CSV from: ${CSV_FILE_PATH}`);
    console.log(`Loaded ${expectedPhones.length} expected phone numbers from CSV.`);
  });
});

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

async function extractPhoneNumbers(page: Page, selectors: string[]): Promise<string[]> {
  const extractedNumbers: Set<string> = new Set();
  
  for (const selector of selectors) {
    // This top-level step now describes the action of trying to extract phones
    await test.step(`Attempting to extract phones with selector: "${selector}"`, async () => {
      try {
        await page.waitForSelector(selector, { timeout: 5000, state: 'attached' });
        
        // If the selector is found, proceed with extraction inside a new step
        const elements = await page.$$(selector);
        
        // This attachment is better placed here, as it shows the result of this specific selector
        const extractedPhonesForSelector = await test.step(`Processing ${elements.length} element(s)`, async () => {
          const currentPhones: string[] = [];
          for (const el of elements) {
            const text = await el.innerText();
            if (text.includes('+')) {
              const cleanedNumber = cleanPhoneNumber(text);
              if (cleanedNumber) {
                currentPhones.push(cleanedNumber);
              }
            }
          }
          return currentPhones;
        });

        // Add the cleaned phones to the main set
        extractedPhonesForSelector.forEach(phone => extractedNumbers.add(phone));
        
      } catch (e) {
        // FIX: The test.step here now has a name and an empty callback function.
        await test.step(`Warning: Selector "${selector}" not found, skipping.`, async () => {});
        console.warn(`Selector "${selector}" not found on the page, skipping extraction.`);
      }
    });
  }

  // After the loop, attach the final combined result to the overall report
  const extractedContent = JSON.stringify(Array.from(extractedNumbers), null, 2);
  await allure.attachment('All Extracted Phone Numbers', extractedContent, 'application/json');

  return Array.from(extractedNumbers);
}

test('Validate phone numbers on homepage and contact page against CSV', async ({ page }) => {
  // FIX: Declare variables at the top level of the test scope
  let homePagePhones: string[] = [];
  let contactPagePhones: string[] = [];
  
  await test.step('1. Validate phone numbers on the homepage', async () => {
    await page.goto('/');
    await test.step('Navigate to homepage', async () => {
      await expect(page).toHaveURL('/');
      await allure.attachment('Homepage Screenshot', await page.screenshot(), 'image/png');
    });

    const homePageSelectors = ['a[href^="tel:"]'];
    homePagePhones = await extractPhoneNumbers(page, homePageSelectors); // Assign value here
    
    console.log(`📞 Found ${homePagePhones.length} phone numbers on homepage:`, homePagePhones);
    
    await test.step('Assert that homepage numbers are in CSV', async () => {
      for (const phone of homePagePhones) {
        expect(expectedPhones, `Phone number "${phone}" from homepage is not in the CSV file.`).toContain(phone);
      }
    });
  });

  await test.step('2. Validate phone numbers on the contact page', async () => {
    await test.step('Navigate to contact page', async () => {
      await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
      await expect(page).toHaveURL(/contact-us/);
      await allure.attachment('Contact Page Screenshot', await page.screenshot(), 'image/png');
    });
    
    const contactPageSelectors = ['span.pra-medium.pra-medium-font'];
    contactPagePhones = await extractPhoneNumbers(page, contactPageSelectors); // Assign value here

    console.log(`📞 Found ${contactPagePhones.length} phone numbers on contact page:`, contactPagePhones);

    await test.step('Assert that contact page numbers are in CSV', async () => {
      for (const phone of contactPagePhones) {
        expect(expectedPhones, `Phone number "${phone}" from contact page is not in the CSV file.`).toContain(phone);
      }
    });
  });

  await test.step('3. Validate all CSV numbers are present on the site', async () => {
    // FIX: Use the correctly scoped variables
    const allExtractedPhones = new Set([...homePagePhones, ...contactPagePhones]);
    
    for (const expectedPhone of expectedPhones) {
      await test.step(`Checking if ${expectedPhone} is on the site`, async () => {
        const isPresent = Array.from(allExtractedPhones).some(extractedPhone => extractedPhone.includes(expectedPhone));
        expect(isPresent, `Expected phone number "${expectedPhone}" from CSV is not found on either homepage or contact page.`).toBeTruthy();
      });
    }
  });
});
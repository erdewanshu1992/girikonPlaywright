import { test, expect, Page } from '@playwright/test';
import { readExpectedPhonesFromsCSV } from '../utils/csvReader';
import { existsSync } from 'fs';

const CSV_FILE_PATH = 'expected-numbers.csv';

let expectedPhones: string[];
test.beforeAll(() => {
  if (!existsSync(CSV_FILE_PATH)) {
    throw new Error(`CSV file not found at: ${CSV_FILE_PATH}. Please check the path.`);
  }

  expectedPhones = readExpectedPhonesFromsCSV(CSV_FILE_PATH);
  if (expectedPhones.length === 0) {
    throw new Error(`Expected phone numbers list is empty. Please check the CSV file at ${CSV_FILE_PATH}.`);
  }
  console.log(`📁 Reading CSV from: ${CSV_FILE_PATH}`);
  console.log(`Loaded ${expectedPhones.length} expected phone numbers from CSV.`);
});

/**
 * Utility function to clean a string to extract only the phone number part.
 * It looks for a '+' sign and then keeps only digits from that point on.
 * @param phoneString The raw string containing the phone number.
 * @returns The cleaned phone number string, or an empty string if no valid number is found.
 */
function cleanPhoneNumber(phoneString: string): string {
  // Find the index of the first occurrence of '+'
  const plusIndex = phoneString.indexOf('+');
  if (plusIndex === -1) {
    // If no '+' is found, it's not a valid international phone number in our format.
    return '';
  }

  // Extract the substring starting from the '+'
  let onlyPhone = phoneString.substring(plusIndex);
  
  // Use a regular expression to remove any characters that are not a digit or a plus sign
  // This will handle the extra 'USA', 'UK', etc. and the trailing comma.
  return onlyPhone.replace(/[^0-9+]/g, '');
}

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

test('Validate phone numbers on homepage and contact page against CSV', async ({ page }) => {
  console.log('Validating homepage phone numbers...');
  await page.goto('/');
  const homePageSelectors = ['a[href^="tel:"]'];
  const homePagePhones = await extractPhoneNumbers(page, homePageSelectors);
  
  console.log(`📞 Found ${homePagePhones.length} phone numbers on homepage:`, homePagePhones);
  
  for (const phone of homePagePhones) {
    expect(expectedPhones, `Phone number "${phone}" from homepage is not in the CSV file.`).toContain(phone);
  }

  console.log('Navigating to contact page...');
  // FIX: Use 'exact: true' to resolve the strict mode violation
  await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
  await expect(page).toHaveURL(/contact-us/);
  
  const contactPageSelectors = ['span.pra-medium.pra-medium-font'];
  const contactPagePhones = await extractPhoneNumbers(page, contactPageSelectors);

  console.log(`📞 Found ${contactPagePhones.length} phone numbers on contact page:`, contactPagePhones);

  for (const phone of contactPagePhones) {
    expect(expectedPhones, `Phone number "${phone}" from contact page is not in the CSV file.`).toContain(phone);
  }

  console.log('Validating that all CSV numbers are present on the site...');
  const allExtractedPhones = new Set([...homePagePhones, ...contactPagePhones]);
  
  for (const expectedPhone of expectedPhones) {
    const isPresent = Array.from(allExtractedPhones).some(extractedPhone => extractedPhone.includes(expectedPhone));
    expect(isPresent, `Expected phone number "${expectedPhone}" from CSV is not found on either homepage or contact page.`).toBeTruthy();
  }
  
});











// import { test } from '@playwright/test';

// test('print header phone numbers from homepage', async ({ page }) => {
//   await page.goto('/');

//   const headerPhones = await page.$$eval('a[href^="tel:"]', anchors =>
//     anchors
//       .map(a => a.textContent?.trim() || '')
//       .filter(text => text.startsWith('+'))
//   );

//   console.log('📞 Header Phone Numbers:', headerPhones);
// });
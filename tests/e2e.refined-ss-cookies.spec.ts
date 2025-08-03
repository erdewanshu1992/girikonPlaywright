import { test, expect, Page } from "@playwright/test";
import { readExpectedPhonesFromCSV } from '../utils/csvReader';
import path from 'path';
import { existsSync } from 'fs';


// 1. Define the correct, absolute path to the CSV file
const CSV_FILE_PATH = path.resolve(__dirname, '..', 'expected-numbers.csv');

// 2. Global variable to store the expected phone numbers
let expectedPhones: string[];

// 3. Load the CSV data once before the test suite runs
test.beforeAll(() => {
    if (!existsSync(CSV_FILE_PATH)) {
        throw new Error(`CSV file not found at: ${CSV_FILE_PATH}. Please check the path.`);
    }

    expectedPhones = readExpectedPhonesFromCSV(CSV_FILE_PATH);
    if (expectedPhones.length === 0) {
        throw new Error(`Expected phone numbers list is empty. Please check the CSV file at ${CSV_FILE_PATH}.`);
    }
    console.log(`📁 Reading CSV from: ${CSV_FILE_PATH}`);
    console.log(`Loaded ${expectedPhones.length} expected phone numbers from CSV.`);
});

// Utility function to handle the cookie notice pop-up (retained from your code)
async function handleCookieNotice(page: Page) {
    const cookieNotice = page.locator('.cookieNotice.open');
    if (await cookieNotice.isVisible()) {
        const noticeText = await page.locator('.cookieNotice .col-md-11').innerText();
        console.log(`🍪 Found cookie notice with text: "${noticeText}"`);
        await page.getByRole('button', { name: 'Got It' }).click();
        await expect(cookieNotice).not.toBeVisible();
        console.log('🍪 Successfully clicked "Got It" and closed the cookie notice.');
    }
}

// Utility function for robust phone number cleaning
function cleanPhoneNumber(phoneString: string): string {
    const plusIndex = phoneString.indexOf('+');
    if (plusIndex === -1) {
        return '';
    }
    let onlyPhone = phoneString.substring(plusIndex);
    return onlyPhone.replace(/[^0-9+]/g, '');
}

// Utility function to extract numbers using the cleanPhoneNumber logic
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
    
    // This is the clean, final version of the contact numbers test
    test('should match contact numbers with CSV', async ({ page }) => {
        await page.goto("/");
        await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
        await expect(page).toHaveURL(/contact-us/);
        
        // Use the utility function to extract and clean the phones from the page
        const contactPageSelectors = ['span.pra-medium.pra-medium-font'];
        const extractedPhones = await extractPhoneNumbers(page, contactPageSelectors);

        // The expectedPhones variable is populated correctly from the `beforeAll` hook
        console.log(`📞 Extracted from site (${extractedPhones.length}):`, extractedPhones);
        console.log(`📁 Expected from CSV (${expectedPhones.length}):`, expectedPhones);

        // The assertion is now correct and will pass if the numbers match
        expect(extractedPhones).toEqual(expect.arrayContaining(expectedPhones));

        await page.goBack();
        await expect(page).toHaveURL('/');
    });
});
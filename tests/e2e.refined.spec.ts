import { test, expect } from "@playwright/test";
import { readExpectedPhonesFromCSV } from '../utils/read-csv.ts';

test.describe("E2E Tests", () => {
    test("should load the homepage", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Girikon/);
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

            // Find the parent list item (li) of the header link
            const parentLi = headerLocator.locator('xpath=ancestor::li');
            
            // Now, find the specific sub-link within that parent li
            const subLink = parentLi.getByRole('link', { name: header.linkText, exact: true });

            await expect(subLink).toBeVisible();

            // Use scrollIntoViewIfNeeded() to handle potential viewport issues
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

    test('should navigate contact page', async ({ page }) => {
        await page.goto("/");
        await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
        await expect(page).toHaveURL(/contact-us/);

        const phoneSpans = page.locator('span.pra-medium.pra-medium-font');
        await expect(phoneSpans.first()).toBeVisible();
        const count = await phoneSpans.count();
        console.log(`📞 Total contact numbers found: ${count}`);

        for (let i = 0; i < count; i++) {
            const number = await phoneSpans.nth(i).innerText();
            if (number.includes('+')) {
                console.log(`✅ Phone: ${number}`);
            }
        }
        await page.goBack();
        await expect(page).toHaveURL("/");
    });

    test('should match contact numbers with CSV (Refined)', async ({ page }) => {
        await page.goto("/");
        await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
        await expect(page).toHaveURL(/contact-us/);

        const phoneSpans = page.locator('span.pra-medium.pra-medium-font');
        await expect(phoneSpans.first()).toBeVisible();
        const count = await phoneSpans.count();
        const extractedPhones: string[] = [];

        for (let i = 0; i < count; i++) {
            const text = await phoneSpans.nth(i).innerText();
            if (text.includes('+')) {
                const plusIndex = text.indexOf('+');
                let onlyPhone = text.slice(plusIndex);
                onlyPhone = onlyPhone.replace(/,$/, '').trim();
                extractedPhones.push(onlyPhone);
            }
        }

        const expectedPhones = readExpectedPhonesFromCSV();
        console.log(`📞 Extracted from site (${extractedPhones.length}):`, extractedPhones);
        console.log(`📁 Expected from CSV (${expectedPhones.length}):`, expectedPhones);

        expect(extractedPhones).toEqual(expect.arrayContaining(expectedPhones));

        await page.goBack();
        await expect(page).toHaveURL('/');
    });
});
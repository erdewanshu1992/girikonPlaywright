import { test, expect, Page } from "@playwright/test";
import { readExpectedPhonesFromCSV } from '../utils/read-csv.ts';
// import { readExpectedPhonesFromsCSV } from '../utils/csvReader.ts';
import { existsSync } from 'fs';




test.describe("E2E Tests", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Girikon/);
  });

  test("should navigate to company header through the hover action", async ({ page,}) => {
    await page.goto("/");
    const companyHeader = page.locator('[data-hover="Company"]').nth(1);
    await companyHeader.hover();
    await page.waitForTimeout(2000); // wait for hover effect to take place

    // ✅ Adjusted submenu locator: find visible <ul class="sub-menu">
    const parentLi = companyHeader.locator('xpath=ancestor::li[contains(@class, "menu-item-has-children")]');
    const subItems = parentLi.locator('ul.sub-menu li');
    await expect(subItems.first()).toBeVisible();

    const subCount = await subItems.count();
    console.log(`Company submenu items: ${subCount}`);
    for (let i = 0; i < subCount; i++) {
      console.log(` - ${await subItems.nth(i).innerText()}`);
    }

    await page.getByRole('link', { name: 'About Us' }).click();
    await expect(page).toHaveURL(/about-us/);
    await page.goBack();
    await expect(page).toHaveURL("/");

  });

  test("should navigate too service header through the hover action", async ({ page, }) => {
    await page.goto("/");
    const servicesHeader = page.locator('//span[@data-hover="Services"]').nth(1);
    await servicesHeader.hover();
    await page.waitForTimeout(2000); // wait for hover effect to take place

    // ✅ Adjusted submenu locator: find visible <ul class="sub-menu">
    const parentLi = servicesHeader.locator('xpath=ancestor::li[contains(@class, "menu-item-has-children")]');
    const subItems = parentLi.locator('ul.sub-menu li');
    await expect(subItems.first()).toBeVisible();

    const subCount = await subItems.count();
    console.log(`Services submenu items: ${subCount}`);
    for (let i = 0; i < subCount; i++) {
      console.log(` - ${await subItems.nth(i).innerText()}`);
    }

    await page.locator('#salesforce-cloud').getByRole('link', { name: 'Salesforce Consulting Services' }).click();
    await page.waitForTimeout(2000); 
    await expect(page).toHaveURL(/salesforce-consulting-services/);
    await page.goBack();
    await expect(page).toHaveURL("/");

  });

  test("should navigate too AI Service header through the hover action", async ({ page, }) => {
    await page.goto("/");
    const aiServicesHeader = page.locator('//span[@data-hover="AI Services"]').nth(1);
    await aiServicesHeader.hover();
    await page.waitForTimeout(2000); // wait for hover effect to take place

    // ✅ Adjusted submenu locator: find visible <ul class="sub-menu">
    const parentLi = aiServicesHeader.locator('xpath=ancestor::li[contains(@class, "menu-item-has-children")]');
    const subItems = parentLi.locator('ul.sub-menu li');
    await expect(subItems.first()).toBeVisible();

    const subCount = await subItems.count();
    console.log(`AI Services submenu items: ${subCount}`);
    for (let i = 0; i < subCount; i++) {
      console.log(` - ${await subItems.nth(i).innerText()}`);
    } 

    await page.getByRole('navigation').getByRole('link', { name: 'Salesforce AI Services' }).click();
    await page.waitForTimeout(2000); 
    await expect(page).toHaveURL(/ai-services/);
    await page.goBack();
    await expect(page).toHaveURL("/");

  });

  test("should navigate too Products header through the hover action", async ({ page, }) => {
    await page.goto("/");
    const productsHeader = page.locator('//span[@data-hover="Products"]').nth(1);
    await productsHeader.hover();
    await page.waitForTimeout(2000); // wait for hover effect to take place

    // ✅ Adjusted submenu locator: find visible <ul class="sub-menu">
    const parentLi = productsHeader.locator('xpath=ancestor::li[contains(@class, "menu-item-has-children")]');
    const subItems = parentLi.locator('ul.sub-menu li');
    await expect(subItems.first()).toBeVisible();

    const subCount = await subItems.count();
    console.log(`Product submenu items: ${subCount}`);
    for (let i = 0; i < subCount; i++) {
      console.log(` - ${await subItems.nth(i).innerText()}`);
    }

    await page.getByRole('link', { name: 'Salesforce Apps' }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/apps/);
    await page.goBack();
    await expect(page).toHaveURL("/");

  });

  test("should navigate too Industries header through the hover action", async ({page,}) => {
    await page.goto("/");

    // ✅ More stable way (without nth)
    const industriesHeader = page.locator('//span[@data-hover="Industries"]').nth(1);
    await industriesHeader.hover();
    await page.waitForTimeout(2000); // wait for hover effect to take place

    // ✅ Adjusted submenu locator: find visible <ul class="sub-menu">
    const parentLi = industriesHeader.locator('xpath=ancestor::li[contains(@class, "menu-item-has-children")]');
    const subItems = parentLi.locator('ul.sub-menu li');
    await expect(subItems.first()).toBeVisible();

    const subCount = await subItems.count();
    console.log(`Industries submenu items: ${subCount}`);
    for (let i = 0; i < subCount; i++) {
      console.log(` - ${await subItems.nth(i).innerText()}`);
    }

    await page.getByRole('link', { name: 'Energy / Utilities' }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/energy-utilities/);
    await page.goBack();
    await expect(page).toHaveURL("/");
    
  });

  test('should navigate the creer page ', async ({ page, }) => {
    await page.goto("/");
    await page.getByRole('link', { name: 'Career Career' }).click();
    await expect(page).toHaveURL(/career/);
    await page.goBack();
    await expect(page).toHaveURL("/");
    
  });


  test('print header phone numbers from homepage', async ({ page }) => {
    await page.goto('/');

    const headerPhones = await page.$$eval('a[href^="tel:"]', anchors =>
      anchors
        .map(a => a.textContent?.trim() || '')
        .filter(text => text.startsWith('+'))
    );

    console.log('📞 Header Phone Numbers:', headerPhones);

  });

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

  test('print header phone numbers from homepages', async ({ page }) => {
    await page.goto('/');

    // Select all phone anchor elements
    const phoneElements = await page.$$('a[href^="tel:"]');

    // Loop through and print phone numbers
    for (const el of phoneElements) {
      const text = await el.innerText();
      if (text.includes('+')) {
        console.log('📞', text.trim());
      }
    }
  });

  test('should navigate contact page', async ({ page, }) => {
    await page.goto("/");
    await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
    await expect(page).toHaveURL(/contact-us/);

    // Dynamic: Find all phone number elements Wait until spans are visible
    await page.waitForSelector('span.pra-medium.pra-medium-font', { timeout: 5000 });

    const phoneSpans = page.locator('span.pra-medium.pra-medium-font');
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

  test('should match contact numbers with CSV', async ({ page }) => {
      await page.goto("/");
      await page.getByRole('link', { name: 'Contact Us Contact Us' }).click();
      await expect(page).toHaveURL(/contact-us/);

      // Use the extractPhoneNumbers utility function here
      const contactPageSelectors = ['span.pra-medium.pra-medium-font'];
      const extractedPhones = await extractPhoneNumbers(page, contactPageSelectors);

      const expectedPhones = readExpectedPhonesFromCSV(CSV_FILE_PATH);

      console.log(`📞 Extracted from site (${extractedPhones.length}):`, extractedPhones);
      console.log(`📁 Expected from CSV (${expectedPhones.length}):`, expectedPhones);

      for (const phone of expectedPhones) {
        expect(extractedPhones).toContain(phone);
        expect(phone).toBeTruthy();
      }

      await page.goBack();
      await expect(page).toHaveURL('/');
  });

  const CSV_FILE_PATH = 'expected-numbers.csv';
  
    let expectedPhones: string[];
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
    // Extract the substring starting from the '+'
    let onlyPhone = phoneString.substring(plusIndex);
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


});

// import fs from 'fs';
// import path from 'path';
// import { parse } from 'csv-parse/sync';

// export function readExpectedPhonesFromCSV(): string[] {
//   const filePath = path.resolve(process.cwd(), 'expected-numbers.csv');
//   if (!fs.existsSync(filePath)) {
//     throw new Error(`CSV file not found at ${filePath}`);
//   }

//   console.log('📁 Reading CSV from:', filePath);

//   const fileContent = fs.readFileSync(filePath, 'utf-8');
//   const records = parse(fileContent, {
//     columns: true,
//     skip_empty_lines: true,
//   });

//   return records.map((row: any) => row.phone.trim());
// }


import { readFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Utility function to clean a phone number string by removing spaces,
 * hyphens, and parentheses, but keeping the leading '+'.
 * @param phoneString The raw phone number string.
 * @returns The cleaned phone number string.
 */
function cleanPhoneNumber(phoneString: string): string {
  // Use a regular expression to remove any characters that are not a digit or a plus sign
  return phoneString.replace(/[\s()-]/g, '');
}

/**
 * Reads a CSV file with 'phone' and 'country' headers, cleans the phone numbers,
 * and returns them as an array of strings.
 * @param filePath The path to the CSV file.
 * @returns An array of cleaned phone number strings.
 */
export function readExpectedPhonesFromCSV(filePath: string): string[] {
  if (!existsSync(filePath)) {
    // Return an empty array instead of throwing an error here. The main test
    // will handle the error gracefully in its beforeAll hook.
    return [];
  }

  try {
    const csvFile = readFileSync(filePath, { encoding: 'utf-8' });
    const records: { country: string, phone: string }[] = parse(csvFile, {
      columns: true, // <-- Correctly handles your header row
      skip_empty_lines: true,
      trim: true,
    });
    
    // Now you can access the data by column name, which is more robust
    return records.map(record => cleanPhoneNumber(record.phone));
    
  } catch (error) {
    console.error('Failed to read or parse CSV file:', error);
    return [];
  }
}
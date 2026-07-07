/**
 * get_web_content.ts - Ручные тесты для WebPageContent
 * Запуск: npx tsx tests_manual/get_web_content.ts
 */

import { WebPageContent } from '../src/backend/services/WebPageContent.js';

async function main() {
  const webPage = new WebPageContent();

  console.log('=== WebPageContent Manual Tests ===\n');
  try {

    const url = 'https://alptransfer.com';

    const result = await webPage.fetchPage({ url });
    console.log('Result length:', result.length);
    console.log('Preview:', result);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();

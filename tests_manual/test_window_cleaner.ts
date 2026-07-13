import { WebPageContent } from '../src/backend/services/WebPageContent.js';

async function main() {
  const webPage = new WebPageContent();
  const url = 'https://www.wildberries.am/catalog/0/search.aspx?search=%D1%80%D0%BE%D0%B1%D0%BE%D1%82%D1%8B%20%D0%BC%D0%BE%D0%B9%D1%89%D0%B8%D0%BA%D0%B8%20%D0%BE%D0%BA%D0%BE%D0%BD';
  console.log(`Fetching: ${url}`);
  
  try {
    const content = await webPage.fetchPage({ url, dynamic: true });
    console.log("Scraped Content Length:", content.length);
    console.log("Preview (first 4000 characters):");
    console.log(content.substring(0, 4000));
  } catch (err: any) {
    console.error("Error fetching page:", err.message);
  }
}

main();

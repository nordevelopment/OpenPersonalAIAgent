import { WebPageContent } from '../src/backend/services/WebPageContent.js';
import * as fs from 'fs';

async function main() {
    const webPage = new WebPageContent();
    const result = await webPage.fetchPage({ url: 'https://alptransfer.com' });
    fs.writeFileSync('d:/MyFiles/AILab/OpenPersonalAIAgent-main/output_utf8.txt', result, 'utf8');
    console.log("Saved content to output_utf8.txt");
}

main();

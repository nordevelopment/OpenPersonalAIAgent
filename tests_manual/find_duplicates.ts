import { WebPageContent } from '../src/backend/services/WebPageContent.js';

async function main() {
    const webPage = new WebPageContent();
    const result = await webPage.fetchPage({ url: 'https://alptransfer.com' });
    
    const lines = result.split('\n').map(l => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    
    for (const line of lines) {
        if (seen.has(line)) {
            duplicates.add(line);
        } else {
            seen.add(line);
        }
    }
    
    console.log("=== Duplicate lines found in fetchPage output: ===");
    if (duplicates.size === 0) {
        console.log("No duplicate lines found!");
    } else {
        for (const dup of duplicates) {
            console.log(`- "${dup}"`);
        }
    }
}

main();

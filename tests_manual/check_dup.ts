import axios from "axios";
import * as cheerio from "cheerio";

async function main() {
    const response = await axios.get("https://alptransfer.com", {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    });
    const $ = cheerio.load(response.data);
    
    console.log("=== Finding occurrences of target text ===");
    $("*").each((_, el) => {
        const text = $(el).clone().children().remove().end().text().trim();
        const lowerText = text.toLowerCase();
        if (lowerText.includes("subscribe") || lowerText.includes("newsletter") || lowerText.includes("sms")) {
            const tagName = el.name;
            const classes = $(el).attr('class') || '';
            const id = $(el).attr('id') || '';
            const style = $(el).attr('style') || '';
            console.log(`Occurrence: "${text.substring(0, 50)}": Tag: ${tagName}, ID: ${id}, Class: ${classes}, Style: ${style}`);
            
            let parent = $(el).parent();
            let depth = 1;
            while (parent.length > 0 && depth <= 3) {
                console.log(`  Parent ${depth}: Tag: ${parent[0].name}, ID: ${parent.attr('id') || ''}, Class: ${parent.attr('class') || ''}, Style: ${parent.attr('style') || ''}`);
                parent = parent.parent();
                depth++;
            }
        }
    });
}

main();

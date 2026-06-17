import axios from "axios";
import * as cheerio from "cheerio";

const TIMEOUT = 30000;
const MAX_HTML_LENGTH = 12000;
const MAX_TEXT_LENGTH = 10000;

export class WebPageContent {

    async fetchPage({ url, method = 'GET', data, headers }: { 
        url: string; 
        method?: string; 
        data?: Record<string, unknown>; 
        headers?: Record<string, string> 
    }): Promise<string> {
        if (!url) return 'Error: URL is required';

        try {
            const response = await axios({
                url: String(url),
                method: String(method).toUpperCase(),
                data,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...headers
                },
                timeout: TIMEOUT
            });

            if (typeof response.data === 'object') {
                return JSON.stringify(response.data, null, 2);
            }

            if (typeof response.data === 'string' && response.data.includes('<html')) {
                const $ = cheerio.load(response.data);
                $('script, style, nav, footer, header, noscript, iframe, ad').remove();
                
                const title = $('title').text().trim();
                let bodyText = $('article, main, .content, #content').text().trim();
                
                if (!bodyText) {
                    bodyText = $('body').text().trim();
                }

                const cleanContent = bodyText
                    .replace(/\s\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .substring(0, MAX_HTML_LENGTH);

                return `Title: ${title}\n\nContent:\n${cleanContent}`;
            }

            return String(response.data).substring(0, MAX_TEXT_LENGTH);

        } catch (error: unknown) {
            const errorMsg = axios.isAxiosError(error) && error.response
                ? `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`
                : error instanceof Error ? error.message : String(error);
            return `Error fetching "${url}": ${errorMsg}`;
        }
    }
}
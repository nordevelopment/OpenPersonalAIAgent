import axios from "axios";
import * as cheerio from "cheerio";
import { browserService } from "./BrowserService.js";
import logger from "../utils/logger.js";

const TIMEOUT = 30000;
const MAX_HTML_LENGTH = 60000;
const MAX_TEXT_LENGTH = 50000;

export class WebPageContent {

    private elementToMarkdown($: cheerio.CheerioAPI, element: any, baseUrl?: string): string {
        if (!element) return "";
        let text = "";

        $(element).contents().each((_, child) => {
            if (child.type === 'text') {
                text += $(child).text();
            } else if (child.type === 'tag') {
                const tagName = child.name.toLowerCase();

                if (['script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'ad'].includes(tagName)) {
                    return;
                }

                const childContent = this.elementToMarkdown($, child, baseUrl).trim();
                if (!childContent) {
                    if (tagName === 'br') {
                        text += '\n';
                    }
                    return;
                }

                switch (tagName) {
                    case 'h1':
                        text += `\n\n# ${childContent}\n\n`;
                        break;
                    case 'h2':
                        text += `\n\n## ${childContent}\n\n`;
                        break;
                    case 'h3':
                        text += `\n\n### ${childContent}\n\n`;
                        break;
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        text += `\n\n#### ${childContent}\n\n`;
                        break;
                    case 'p':
                        text += `\n\n${childContent}\n\n`;
                        break;
                    case 'li':
                        text += `\n* ${childContent}\n`;
                        break;
                    case 'ul':
                    case 'ol':
                        text += `\n${childContent}\n`;
                        break;
                    case 'br':
                        text += '\n';
                        break;
                    case 'hr':
                        text += '\n---\n';
                        break;
                    case 'a':
                        let href = $(child).attr('href');
                        if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
                            if (baseUrl && (href.startsWith('/') || !href.startsWith('http'))) {
                                try {
                                    href = new URL(href, baseUrl).href;
                                } catch (e) {}
                            }
                            const shortHref = href.length > 90 ? href.substring(0, 87) + '...' : href;
                            text += ` [${childContent}](${shortHref}) `;
                        } else {
                            text += ` ${childContent} `;
                        }
                        break;
                    case 'strong':
                    case 'b':
                        text += ` **${childContent}** `;
                        break;
                    case 'em':
                    case 'i':
                        text += ` *${childContent}* `;
                        break;
                    case 'div':
                    case 'section':
                    case 'article':
                    case 'span':
                    default:
                        const isBlock = ['div', 'section', 'article', 'table', 'tr', 'td', 'th', 'header', 'footer'].includes(tagName);
                        if (isBlock) {
                            text += `\n${childContent}\n`;
                        } else {
                            text += ` ${childContent} `;
                        }
                        break;
                }
            }
        });

        return text;
    }

    private cleanMarkdown(text: string): string {
        return text
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async fetchPage({ url, method = 'GET', data, headers, dynamic }: {
        url: string;
        method?: string;
        data?: Record<string, unknown>;
        headers?: Record<string, string>;
        dynamic?: boolean;
    }): Promise<string> {
        if (!url) return 'Error: URL is required';

        try {
            let html: string;

            if (dynamic) {
                html = await browserService.fetchDynamicPage(url);
            } else {
                const response = await axios({
                    url: String(url),
                    method: String(method).toUpperCase(),
                    data,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        ...headers
                    },
                    timeout: TIMEOUT
                });

                if (typeof response.data === 'object') {
                    return JSON.stringify(response.data, null, 2);
                }

                html = String(response.data);
            }

            if (typeof html === 'string' && html.includes('<html')) {
                const $ = cheerio.load(html);

                // If it looks like an empty SPA root and we haven't forced dynamic mode, fall back to Puppeteer
                const bodyText = $('body').text().trim();
                const hasSPARoot = $('#root, #app, #__next, [id*="app"], [id*="root"]').length > 0;
                if (!dynamic && bodyText.length < 300 && hasSPARoot) {
                    logger.info({ url }, 'WebPageContent: SPA detected, falling back to dynamic rendering');
                    return await this.fetchPage({ url, method, data, headers, dynamic: true });
                }

                $('script, style, noscript, iframe, ad, svg, canvas, form').remove();

                const title = $('title').text().trim();
                let $content = $('article, main, .content, #content');

                if ($content.length === 0) {
                    $content = $('body');
                }

                const rawMarkdown = this.elementToMarkdown($, $content[0], url);
                const cleanContent = this.cleanMarkdown(rawMarkdown).substring(0, MAX_HTML_LENGTH);

                return `Title: ${title}\n\nContent:\n${cleanContent}`;
            }

            return String(html).substring(0, MAX_TEXT_LENGTH);

        } catch (error: unknown) {
            // Fallback to dynamic if static fetch fails
            if (!dynamic) {
                logger.info({ url }, 'WebPageContent: Static fetch failed. Trying dynamic rendering...');
                try {
                    return await this.fetchPage({ url, method, data, headers, dynamic: true });
                } catch (fallbackError) {
                    // Ignore fallback error, let original or fallback error be handled
                }
            }

            const errorMsg = axios.isAxiosError(error) && error.response
                ? `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`
                : error instanceof Error ? error.message : String(error);
            return `Error fetching "${url}": ${errorMsg}`;
        }
    }
}
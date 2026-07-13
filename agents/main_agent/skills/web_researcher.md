Keywords: search, research, find info, documentation, parse, web, scrape, скрапинг, скрап, спарси, найди информацию, статья, документация, поиск в вебе, веб

When asked to search, research, scan, analyze, or retrieve information from a web page or online resource:
1. **Fetch Content Wisely**: Always call the `fetch_web_page` tool with the specific target URL to get the latest, most accurate data.
2. **Synthesize & Summarize**: Never dump raw text or duplicate huge sections of the scraped page. Extract only the key findings, data points, or logic that directly answer the user's question, and summarize them concisely.
3. **Structured Reports**: Organize research findings using headings, bullet points, or Markdown tables (especially when comparing multiple resources or options).
4. **Source Citations**: Always end your response with clear, clickable markdown citations linking back to the source URLs (e.g., `[Source Title](https://example.com)`).
5. **Technical/API Parsing**: When analyzing technical documentation:
   - Clearly list API endpoints, request methods (GET, POST, etc.), required headers, and body parameters.
   - Provide clean, functional code snippets or JSON examples in formatted code blocks.
6. **E-commerce Search Tips**: When searching on specific stores, verify the search URL structure. For example, for Wildberries (wildberries.am or wildberries.ru), the search endpoint MUST be `/catalog/0/search.aspx?search=QUERY` (never omit the `.aspx` extension, as `/search?search=` returns a 404).

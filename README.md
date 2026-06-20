# 🤖 Open Personal AI Agent (PAIAgent)

A lightweight, high-performance, and modular personal AI assistant workspace built using **Node.js**, **TypeScript**, and **Fastify**. It is designed as a streamlined, dependency-light alternative to heavy agentic frameworks (like LangChain), allowing you to run a highly customizable agent with local storage, tool execution, and Telegram integration.

---

## 🚀 Key Features

*   **⚡ Lightweight & Fast**: Avoids heavy NPM packages. Built using pure TypeScript, Fastify, and direct API calls for optimal speed and memory footprint.
*   **👁️ Multimodal AI Vision & Recognition**:
    *   Directly attach images in the Web Workspace.
    *   Automatic image preprocessing (resizing and JPEG conversion) to optimize payload size.
    *   Local storage cache for uploaded images, translated back to base64 on-the-fly for AI completion requests.
*   **🧩 Modular System Prompt Assembly**: Automatically compiles the agent's system prompt from multiple self-contained Markdown files (`Identity.md`, `User.md`, `Agent.md`, `Skills.md`, `Memory.md`).
*   **💬 Dual User Interfaces**:
    *   **Web Workspace**: A responsive, interactive chat UI with cyberpunk styling, image attachments, previews, and responsive layouts.
    *   **Telegram Bot**: Access and chat with your agent remotely on-the-go via a dedicated Telegram Bot.
*   **💾 Local SQLite Database with Vector Support**:
    *   Saves chat sessions and history using `better-sqlite3`.
    *   Supports vector embedding storage and retrieval using the low-dependency `sqlite-vec` extension for long-term and short-term semantic memory.
*   **🔧 Powerful Tool Execution (Function Calling)**:
    *   **File System Manager**: Confined read, write, update, and deletion of text files within a dedicated local `workspace/` folder.
    *   **Web Scraper**: Downloads and cleans web pages (stripping HTML, handling JSON) using Cheerio for real-time information retrieval.
    *   **Image Generation (`generate_image`)**: AI can call Together AI or X.AI APIs to generate images on-demand. Generated images are rendered inline dynamically as clickable cards.

---

## 🛠️ Architecture & Tech Stack

The application is structured into a clean backend server serving a single-page chat frontend:

*   **Backend**: [Fastify](https://fastify.dev/) (Fast and low-overhead web framework for Node.js), TypeScript.
*   **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) & [sqlite-vec](https://github.com/asg017/sqlite-vec) (Vector search extension).
*   **Telegram**: [Telegraf](https://github.com/telegraf/telegraf) (Telegram Bot API wrapper).
*   **HTTP & Scraping**: [Axios](https://github.com/axios/axios) and [Cheerio](https://cheerio.js.org/).
*   **Image Processing**: [Sharp](https://github.com/lovell/sharp).

---

## 📁 Directory Structure

```text
├── agents/                     # Agent profile definitions
│   ├── main_agent/             # Default active agent profile
│   │   ├── Identity.md         # Personality, name, tone, and traits
│   │   ├── User.md             # Custom user configuration (preferences, name)
│   │   ├── Agent.md            # Main loop and operational rules
│   │   ├── Skills.md           # Description of available tools
│   │   └── Memory.md           # Instructions on how memories are structured
│   └── test_agent/             # Alternative agent profile
├── frontend/                   # Web interface assets (CSS, JS)
│   ├── css/                    # Custom styling (cybercore.css theme)
│   └── js/                     # Frontend client logic
├── src/
│   ├── backend/                # Server source code (TypeScript)
│   │   ├── ai/                 # Orchestrator, AI clients, tools, memory managers
│   │   ├── database/           # SQLite connection, schema, database reset scripts
│   │   ├── services/           # Filesystem, Image, Web fetching, and Telegram bot services
│   │   ├── app.ts              # App configurations, hooks, session setup
│   │   ├── config.ts           # System environment variables mapper
│   │   └── server.ts           # Server entry point
│   └── views/                  # Frontend EJS views/templates
│       └── chat.ejs            # Main chat template page
├── workspace/                  # Safe folder for agent file-system tool operations
├── package.json                # Project dependencies and script runner
└── tsconfig.json               # TypeScript compiler config
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18.x or later)
*   npm (v9.x or later)

### 1. Clone & Install Dependencies
Clone this repository to your local machine and install the required Node modules:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in your keys:
*   `AI_API_KEY`: Your OpenRouter API Key (to use the completion and embedding models).
*   `TELEGRAM_BOT_TOKEN`: (Optional) If you want to chat through Telegram, create a bot via BotFather and paste the token here.
*   `TOGETHER_API_KEY` / `XAI_API_KEY`: (Optional) Required if you want the agent to use Together AI or X.AI for generating images.

### 3. Initialize & Run
```bash
# Run the development watch server (runs with tsx watch)
npm run dev

# Reset or recreate the SQLite database schema
npm run db:reset

# Compile TypeScript to JavaScript
npm run build

# Run the compiled production application
npm start
```
The server will start by default at `http://127.0.0.1:3000`. Open this URL in your browser to interact with the web workspace.

---

## 🤖 Prompt Customization

You can change the agent's behavior, style, and tone in real-time by editing the files inside `agents/main_agent/`. When the backend starts or a new prompt compilation is requested, the system combines them sequentially to construct the master System Prompt:

1.  **Identity**: "Who am I?" (Name, gender, tone of voice, language preferences).
2.  **User**: "Who is the user?" (Name, preferences, address instructions).
3.  **Agent**: "How should I act?" (Action-first principles, constraints, tool rules).
4.  **Skills**: "What can I do?" (Capabilities overview).
5.  **Memory**: "How do I recall details?" (Vector DB guidelines).

---

## 📸 Screenshots

<img width="1321" height="896" alt="Image" src="https://github.com/user-attachments/assets/1ba12201-1598-4fb8-b4db-d4784b29053a" />

<img width="1324" height="906" alt="Image" src="https://github.com/user-attachments/assets/fd67abfb-d6cc-419d-96a8-c50e1e9b9386" />

<img width="1327" height="909" alt="Image" src="https://github.com/user-attachments/assets/c7c5b65c-dfd6-4ce4-a39b-730c49287329" />

<img width="1327" height="907" alt="Image" src="https://github.com/user-attachments/assets/f5c4e302-61fe-41bc-a6a3-d741492d9250" />

<img width="1331" height="877" alt="Image" src="https://github.com/user-attachments/assets/f71a6b2f-0365-4f31-ba97-fa195f03e251" />

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
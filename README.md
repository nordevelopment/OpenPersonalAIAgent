# 🤖 Open Personal AI Agent (PAIAgent)

A lightweight, fast, and modular personal AI assistant workspace running locally on your computer or server. No bloated frameworks (like LangChain) eating up your RAM. Just clean TypeScript, high-speed execution, and total control over your private data.

**Author:** Norayr Petrosyan

---

## 💡 What is this project for?
This project is designed for anyone who wants a personal AI assistant that can manage local files, browse the web, generate images, and communicate seamlessly through a slick web interface or remotely on-the-go via a Telegram bot.

---

## ⚡ Key Features

*   **🧠 Modular System Prompt Assembly**: The agent's personality and instructions are compiled dynamically from simple Markdown files (`Identity.md`, `User.md`, `Agent.md`, etc.). Want to retrain your agent? Just edit the text!
*   **⚙️ Web Settings Panel (Setup Wizard)**: Forget manually editing `.env` files. On first launch, the app automatically redirects you to a system settings page to input your API keys. Configurations are saved securely in a local, gitignored `config.json`.
*   **🔧 Powerful Tool Execution (Function Calling)**:
    *   **File System Manager**: The AI can create, read, update, and delete text files within a dedicated local `workspace/` folder.
    *   **Web Scraper**: Downloads pages, strips out bloated HTML, and cleans the text for real-time AI analysis.
    *   **Image Generation**: Generates images using **Together AI** or **X.AI (Grok)** APIs directly in the chat, with smart fallback logic (if one provider is not configured, it automatically uses the other).
*   **👁️ Multimodal Vision**: Attach images in the chat — the AI automatically resizes and converts them to analyze the visuals.
*   **💬 Dual Interfaces**: A beautiful cyberpunk-themed Web Workspace + remote chat access via a Telegram bot.
*   **💾 Semantic Memory (SQLite + Vectors)**: Saves chat sessions and history using SQLite, with support for semantic vector search via the lightweight `sqlite-vec` extension.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Fastify (faster and lighter than Express), TypeScript.
*   **Frontend**: EJS, Vanilla CSS (cyberpunk theme), Vanilla JS.
*   **Database**: `better-sqlite3` & `sqlite-vec` extension.
*   **Media Processing**: `sharp` (optimizes images for AI inputs).
*   **HTTP & Scraping**: `axios` + `cheerio`.
*   **Telegram integration**: `telegraf`.

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v20.x or later)
*   npm (v9.x or later)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to a new `.env` file:
```bash
cp .env.example .env
```
*(You can write keys here, or configure them directly in your browser on first launch!)*

### 3. Run the Application
```bash
# Run the development server (with hot reloading)
npm run dev

# Recreate/reset the SQLite database schema
npm run db:reset

# Compile TypeScript to JavaScript
npm run build

# Start the compiled production app
npm start
```
The server will start at `http://127.0.0.1:3000`. Open it in your browser. If keys are missing, you will be automatically redirected to the settings wizard page.

---

## 📸 Screenshots
<img width="926" height="950" alt="Image" src="https://github.com/user-attachments/assets/d69210a3-d40e-4c9e-a1a7-c7cfe1ea6eaa" />

<img width="1321" height="896" alt="Image" src="https://github.com/user-attachments/assets/1ba12201-1598-4fb8-b4db-d4784b29053a" />

<img width="1324" height="906" alt="Image" src="https://github.com/user-attachments/assets/fd67abfb-d6cc-419d-96a8-c50e1e9b9386" />

<img width="1327" height="909" alt="Image" src="https://github.com/user-attachments/assets/c7c5b65c-dfd6-4ce4-a39b-730c49287329" />

<img width="1327" height="907" alt="Image" src="https://github.com/user-attachments/assets/f5c4e302-61fe-41bc-a6a3-d741492d9250" />

<img width="1331" height="877" alt="Image" src="https://github.com/user-attachments/assets/f71a6b2f-0365-4f31-ba97-fa195f03e251" />

---

## ⚖️ Comparison: PAIAgent vs. Heavyweight Alternatives

If you've tried running other self-hosted AI interfaces, you know how resource-heavy they can be. Here is how **PAIAgent** compares to popular alternatives:

| Feature / Metric | 🤖 **PAIAgent (This Project)** | 🐳 **Open WebUI** | 💬 **LibreChat** | 📦 **AnythingLLM** |
| :--- | :--- | :--- | :--- | :--- |
| **Tech Stack** | Node.js + Fastify + SQLite | Python + Go + Svelte | Node + React + Mongo + Redis | Electron / Docker |
| **RAM Footprint** | **~50 - 100 MB** | 1.5 GB+ (Docker container) | 1 GB+ (Docker multi-container) | 500 MB+ (Electron/Docker) |
| **Dependencies** | None (Just Node.js & npm) | Requires Docker & Ollama | Requires Docker, Mongo, Redis | Requires Docker or Desktop App |
| **Startup Time** | **< 1 second** | 30 - 60 seconds | 30 - 60 seconds | 10 - 20 seconds |
| **Database** | Embedded SQLite (+ `sqlite-vec`) | PostgreSQL / MySQL / SQLite | MongoDB + Meilisearch | Embedded Vector DB + SQLite |
| **Ideal For** | Fast, lightweight personal use | Heavy multi-user hosting | Multi-user enterprise chat | Document-focused local RAG |

---

## 💖 Support the Project

If this project saved your RAM and made your local AI workflow smoother, consider supporting its development:

*   **GitHub Sponsors**: [Sponsor nordevelopment](https://github.com/sponsors/nordevelopment)
*   **Buy Me a Coffee**: [Buy me a coffee](https://www.buymeacoffee.com/nordevelopment) (or configure your own link!)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
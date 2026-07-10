# 🤖 Open Personal AI Agent (PAIAgent)

[![GitHub Sponsors](https://img.shields.io/github/sponsors/nordevelopment?color=EA4AAA&style=flat-square)](https://github.com/sponsors/nordevelopment)
[![GitHub Stars](https://img.shields.io/github/stars/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/network/members)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/commits/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<a href="https://nordevelopment.github.io/OpenPersonalAIAgent/">Open Personal AI Agent project page</a>

A lightweight, fast and Personal AI Agent (PAIAgent) running locally on your computer or server. Inspired by OpenClaw and designed as its ultra-lightweight, zero-bloat alternative. No bloated frameworks (like LangChain) eating up your RAM. Just clean TypeScript, high-speed execution, and total control over your private data.

---

## 💡 What is this project for?
This project is designed for anyone who wants a personal AI assistant that can manage local files, browse the web, generate images, and communicate seamlessly through a slick web interface or remotely on-the-go via a Telegram bot.

### 🔒 100% Self-Hosted & Private
PAIAgent runs entirely on your local machine or private server. All chat history, settings, and workspace documents are stored in a local SQLite database. Your private data never leaves your computer, and you retain absolute control over which external APIs (like OpenRouter or Together AI) are called.

### 🔓 Fully Open Source
Built with clean TypeScript and vanilla web technologies under the MIT license. No massive, opaque frameworks (like LangChain) or hidden tracking. You have full transparency, can easily audit the source code, and can freely modify or extend the agent's tools and behaviors.

---

## ⚡Features
*   **💬 Dual Interfaces**: A beautiful cyberpunk-themed Web UI + Remote chat access via a Telegram bot.
*   **🧠 Modular System Prompt**: The agent's personality and instructions are compiled dynamically from simple Markdown files (`Agent.md`, `Identity.md`, `User.md`, `Memory.md`).
*   **⚙️ Web Settings Panel (Setup Wizard)**: Forget manually editing `.env` files. On first launch, the app automatically redirects you to a system settings page to input your API keys. Configurations are saved securely in a local, gitignored `config.json`.
*   **👁️ AI Vision**: Attach images in the chat — the AI automatically resizes and converts them to analyze the visuals.
*   **🔧 Powerful Tool Execution (Function Calling)**:
    *   **File System Manager**: The AI can create, read, update, and delete text files within a dedicated local `workspace/` folder.
    *   **Web Scraper**: Downloads pages, strips out bloated HTML, and cleans the text for real-time AI analysis.
    *   **Image Generation**: Generates images using **Together AI** or **X.AI (Grok)** APIs directly in the chat, with smart fallback logic (if one provider is not configured, it automatically uses the other).
*   **💾 Semantic Memory (SQLite + Vectors)**: Saves chat sessions and history using SQLite, with support for semantic vector search via the lightweight `sqlite-vec` extension.
*   **📋 Task Management**: Manual run Tasks, AI agent being get tasks do it, shows status to user in UI.

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
git clone https://github.com/nordevelopment/OpenPersonalAIAgent
or you can download the zip file from https://github.com/nordevelopment/OpenPersonalAIAgent

npm install
```
### 2. Run the Application
```bash
# Run Server - build and start app
# Start the compiled production app
npm start


# For Developers
# Run the development server (with hot reloading)
npm run dev

# Recreate/reset the SQLite database schema
npm run db:reset

# run only build command
npm run build 
```
The server will start at `http://127.0.0.1:3000`. Open it in your browser. 
First run or no config files found, you will be automatically redirected to the settings wizard page.

## 🔒 Security

PAIAgent includes built-in security features to protect your server, files, and API balances when deployed remotely:

*   **HTTP Basic Auth**: Lock the Web UI and API endpoints behind a password. Set `APP_PASSWORD` (and optionally `APP_USER`) in your `.env` to enable it. Leaving `APP_PASSWORD` empty disables authentication (ideal for local localhost use).
*   **Telegram Bot Whitelist**: Restrict access to your Telegram bot. Set `ALLOWED_TELEGRAM_USER_IDS` in your `.env` with a comma-separated list of Telegram User IDs to prevent unauthorized users from using your bot and API balances.
*   **Strict Path Validation**: All AI file operations (read, write, delete) are strictly validated using `path.relative` comparison to ensure the AI cannot escape or access files outside the designated `workspace/` folder.
*   **Safe Agent Directory Routing**: Directory operations on agent profiles (like editing files) sanitize all incoming IDs to prevent Path Traversal outside the `agents/` folder.
*   **Secure Cookies & Sessions**: Session IDs are generated using Node's cryptographically secure `crypto.randomUUID()` and session cookies are protected with `sameSite: 'lax'` and conditional `secure` flags.

---

## 📸 Screenshots
<img width="1303" height="895" alt="Image" src="https://github.com/user-attachments/assets/dd7af846-8534-4f9a-860b-59f654326fac" />

<img width="1297" height="898" alt="Image" src="https://github.com/user-attachments/assets/d9a2a92e-6338-4a39-bb11-a68821ff2e4b" />

<img width="1305" height="897" alt="Image" src="https://github.com/user-attachments/assets/f02a3c3b-0ea0-41de-b73d-99a36dabd475" />

<img width="1549" height="903" alt="Image" src="https://github.com/user-attachments/assets/5a6d1b22-39a2-4e05-a167-1c5eef931b65" />

<img width="1248" height="614" alt="Image" src="https://github.com/user-attachments/assets/d321fd1c-2841-4e4d-8569-9a62e938a1ea" />

---

## ⚖️ Comparison: PAIAgent vs. Heavyweight Alternatives

If you've tried running other self-hosted AI interfaces, you know how resource-heavy they can be. Here is how **PAIAgent** compares to popular alternatives:

| Feature / Metric | 🤖 **PAIAgent (This Project)** | 🐳 **Open WebUI** | 💬 **LibreChat** | 📦 **AnythingLLM** | 🦞 **OpenClaw** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tech Stack** | Node.js + Fastify + SQLite | Python + Go + Svelte | Node + React + Mongo + Redis | Electron / Docker | TypeScript + Fastify / FastAPI |
| **RAM Footprint** | **~50 - 100 MB** | 1.5 GB+ (Docker container) | 1 GB+ (Docker multi-container) | 500 MB+ (Electron/Docker) | 200 MB+ (pnpm / Docker) |
| **Startup Time** | **< 1 second** | 30 - 60 seconds | 30 - 60 seconds | 10 - 20 seconds | 5 - 10 seconds |
| **Installation** | **< 1 minute (One-command)** | 5+ minutes (Docker setup) | 10+ minutes (Complex Compose) | 5+ minutes (Docker / Installer) | 5+ minutes (pnpm / Docker) |
| **Dependencies** | None (Just Node.js & npm) | Requires Docker & Ollama | Requires Docker, Mongo, Redis | Requires Docker or Desktop App | Node.js, pnpm (or Docker) |
| **Database** | Embedded SQLite (+ `sqlite-vec`) | PostgreSQL / MySQL / SQLite | MongoDB + Meilisearch | Embedded Vector DB + SQLite | SQLite (embedded) |
| **Ideal For** | Fast, lightweight personal use | Heavy multi-user hosting | Multi-user enterprise chat | Document-focused local RAG | Multi-channel agent bots |

---

### Author: Norayr Petrosyan

---

## 💖 Support the Project

If this project saved your RAM and made your local AI workflow smoother, consider supporting its development:

*   **GitHub Sponsors**: [Sponsor nordevelopment](https://github.com/sponsors/nordevelopment)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
# 🤖 Open Personal AI Agent (PAIAgent)

[![GitHub Sponsors](https://img.shields.io/github/sponsors/nordevelopment?color=EA4AAA&style=flat-square)](https://github.com/sponsors/nordevelopment)
[![GitHub Stars](https://img.shields.io/github/stars/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/network/members)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/nordevelopment/OpenPersonalAIAgent?style=flat-square)](https://github.com/nordevelopment/OpenPersonalAIAgent/commits/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A lightweight, fast and Personal AI Agent (PAIAgent) running locally on your computer or server. No bloated frameworks (like LangChain) eating up your RAM. Just clean TypeScript, high-speed execution, and total control over your private data.

---

## 💡 What is this project for?
This project is designed for anyone who wants a personal AI assistant that can manage local files, browse the web, generate images, and communicate seamlessly through a slick web interface or remotely on-the-go via a Telegram bot.

---

## ⚡Features
*   **💬 Dual Interfaces**: A beautiful cyberpunk-themed Web UI + Remote chat access via a Telegram bot.
*   **👁️ AI Vision**: Attach images in the chat — the AI automatically resizes and converts them to analyze the visuals.
*   **🧠 Modular System Prompt**: The agent's personality and instructions are compiled dynamically from simple Markdown files (`Agent.md`, `Identity.md`, `User.md`, `Memory.md`, `Skills.md` etc.).
*   **⚙️ Web Settings Panel (Setup Wizard)**: Forget manually editing `.env` files. On first launch, the app automatically redirects you to a system settings page to input your API keys. Configurations are saved securely in a local, gitignored `config.json`.
*   **🔧 Powerful Tool Execution (Function Calling)**:
    *   **File System Manager**: The AI can create, read, update, and delete text files within a dedicated local `workspace/` folder.
    *   **Web Scraper**: Downloads pages, strips out bloated HTML, and cleans the text for real-time AI analysis.
    *   **Image Generation**: Generates images using **Together AI** or **X.AI (Grok)** APIs directly in the chat, with smart fallback logic (if one provider is not configured, it automatically uses the other).
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
git clone https://github.com/sponsors/nordevelopment
or you can download the zip file from https://github.com/sponsors/nordevelopment

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
npm run buld 
```
The server will start at `http://127.0.0.1:3000`. Open it in your browser. 
First run or no config files found, you will be automatically redirected to the settings wizard page.

---

## 📸 Screenshots
<img width="1303" height="895" alt="Image" src="https://github.com/user-attachments/assets/dd7af846-8534-4f9a-860b-59f654326fac" />

<img width="1297" height="898" alt="Image" src="https://github.com/user-attachments/assets/d9a2a92e-6338-4a39-bb11-a68821ff2e4b" />

<img width="1305" height="897" alt="Image" src="https://github.com/user-attachments/assets/f02a3c3b-0ea0-41de-b73d-99a36dabd475" />

<img width="1549" height="903" alt="Image" src="https://github.com/user-attachments/assets/5a6d1b22-39a2-4e05-a167-1c5eef931b65" />

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

### Author: Norayr Petrosyan

---

## 💖 Support the Project

If this project saved your RAM and made your local AI workflow smoother, consider supporting its development:

*   **GitHub Sponsors**: [Sponsor nordevelopment](https://github.com/sponsors/nordevelopment)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
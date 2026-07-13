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
    *   **Web Scraper**: Downloads pages, strips out bloated HTML, and cleans the text for real-time AI analysis. Supports both fast static scraping (via Axios/Cheerio) and dynamic rendering (via Puppeteer/Chromium) with automatic fallback for SPAs (like React, Vue, e-commerce sites).
    *   **PDF Generator**: The AI can write custom HTML/CSS templates and render them into professional A4 PDF documents saved directly to the workspace.
    *   **Image Generation**: Generates images using **Together AI** or **X.AI (Grok)** APIs directly in the chat, with smart fallback logic (if one provider is not configured, it automatically uses the other).
*   **💾 Semantic Memory (SQLite + Vectors)**: Saves chat sessions and history using SQLite, with support for semantic vector search via the lightweight `sqlite-vec` extension.
*   **📋 Task Management**: Manual run Tasks, AI agent being get tasks do it, shows status to user in UI.

---

## 🛠️ Tech Stack

*   **Backend**: Node.js, Fastify (faster and lighter than Express), TypeScript.
*   **Frontend**: EJS, Vanilla CSS (cyberpunk theme), Vanilla JS.
*   **Database**: `better-sqlite3` & `sqlite-vec` extension.
*   **Media Processing**: `sharp` (optimizes images for AI inputs).
*   **HTTP, Scraping & PDF**: `axios` + `cheerio` + `puppeteer` (headless Chrome).
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
# Start - Build & start the app, Run Server
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

PAIAgent includes built-in security features to protect your server, files, and API balances when deployed remotely. **These security settings can be easily configured either during the first-launch setup wizard, or later at any time via the Web Settings Panel (`/settings` page in the UI).**

*   **HTTP Basic Auth**: Lock the Web UI and API endpoints behind a password. Set `APP_PASSWORD` (and optionally `APP_USER`) in your `.env` (or via Settings UI) to enable it. Leaving `APP_PASSWORD` empty disables authentication (ideal for local localhost use).
*   **Telegram Bot Whitelist**: Restrict access to your Telegram bot. Set `ALLOWED_TELEGRAM_USER_IDS` in your `.env` (or via Settings UI) with a comma-separated list of Telegram User IDs to prevent unauthorized users from using your bot and API balances.
*   **Strict Path Validation**: All AI file operations (read, write, delete) are strictly validated using `path.relative` comparison to ensure the AI cannot escape or access files outside the designated `workspace/` folder.
*   **Safe Agent Directory Routing**: Directory operations on agent profiles (like editing files) sanitize all incoming IDs to prevent Path Traversal outside the `agents/` folder.
*   **Secure Cookies & Sessions**: Session IDs are generated using Node's cryptographically secure `crypto.randomUUID()` and session cookies are protected with `sameSite: 'lax'` and conditional `secure` flags.

---

## 🚀 Video Install & Features Demo
https://www.youtube.com/watch?v=rcRkP_UiDRo

## 📸 Screenshots
<img width="1331" height="852" alt="Image" src="https://github.com/user-attachments/assets/ae759646-c82d-43b5-82fc-66ff4a2857f0" />

<img width="1326" height="849" alt="Image" src="https://github.com/user-attachments/assets/c3992754-6573-4608-8402-dc91edc8e9f8" />

<img width="1334" height="1314" alt="Image" src="https://github.com/user-attachments/assets/ec96e54e-f5d8-4dbe-9965-1e6c38d5dfed" />

<img width="1549" height="903" alt="Image" src="https://github.com/user-attachments/assets/5a6d1b22-39a2-4e05-a167-1c5eef931b65" />

<img width="1248" height="614" alt="Image" src="https://github.com/user-attachments/assets/d321fd1c-2841-4e4d-8569-9a62e938a1ea" />

---

## ⚖️ Why PAIAgent? (Instead of heavy alternatives)

If you've tried running other self-hosted AI interfaces, you know they can easily hog your system resources. PAIAgent is designed to be the exact opposite:

*   **Ultra-lightweight**: Uses only **~50-100 MB RAM** (compared to 1GB+ for Open WebUI or LibreChat).
*   **Instant startup**: Boots up in **less than a second** (no waiting for multi-container Docker warmups).
*   **Zero-bloat setup**: No Docker, MongoDB, or Redis required. Just Node.js, `npm install`, and you're good to go.
*   **Embedded Database**: Powered by a single local SQLite file (with fast vector search support).

---

### Author: Norayr Petrosyan

---

## 💖 Support the Project

If this project saved your RAM and made your local AI workflow smoother, consider supporting its development:

*   **GitHub Sponsors**: [Sponsor nordevelopment](https://github.com/sponsors/nordevelopment)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
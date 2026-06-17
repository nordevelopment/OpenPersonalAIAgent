# Open Personal AI Agent
The idea is to create a system of AI agent similar to OpenClaw - but a mini version, without heavy Node.js packages and without meaningful dependencies

- Agent with chat interface for user interaction
- Interaction with user through telegram bot

The agent will use LLM (AI models) to answer questions, make decisions and perform tasks

The system prompt consists of several parts:
- Identity.md - agent identity prompt
- User.md - user prompt
- Agent.md - main prompt
- Memory.md - memory prompt
- Skills.md - skills prompt

In the end, the System Prompt will be generated from all these files
- History of messages with the agent will be stored in the sqlite database in the database.db file
- The agent's memory will be stored in the vector database sqlite (better-sqlite3)
- Long term and short term memory using the **better-sqlite3** with **sqlite-vec** extension

The agent will have tools to perform various tasks
**Tools:**
- Work with the file system - text files (creation, deletion, reading, writing files)
- Fetch - get information from the web with URL
- Image generation

## Integrated with OpenRouter

**OpenRouter** - a platform that provides access to various AI models.
**Model currently used:** `qwen/qwen3.5-flash-02-23`
**Long Memory Model:** `qwen/qwen3-embedding-8b`

## Screenshots

<img width="1321" height="896" alt="Image" src="https://github.com/user-attachments/assets/1ba12201-1598-4fb8-b4db-d4784b29053a" />


<img width="1324" height="906" alt="Image" src="https://github.com/user-attachments/assets/fd67abfb-d6cc-419d-96a8-c50e1e9b9386" />


<img width="1327" height="909" alt="Image" src="https://github.com/user-attachments/assets/c7c5b65c-dfd6-4ce4-a39b-730c49287329" />


<img width="1327" height="907" alt="Image" src="https://github.com/user-attachments/assets/f5c4e302-61fe-41bc-a6a3-d741492d9250" />
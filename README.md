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

The agent will have tools to perform various tasks
**Tools:**
- Work with the file system - text files (creation, deletion, reading, writing files)
- Image generation
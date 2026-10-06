# 🤖 Gemini AI Agent Visual Studio & Dashboard

A modern, high-performance visual IDE and dashboard for configuring, running, and monitoring autonomous AI Agents powered by **Google Gemini API** (`gemini-2.5-flash` and `gemini-2.5-pro`).

![Theme](https://img.shields.io/badge/Theme-Glassmorphism%20Dark-06b6d4?style=for-the-badge)
![Model](https://img.shields.io/badge/Model-Gemini%202.5-8b5cf6?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

---

## ✨ Features

- **🎛️ Agent Studio**: Visual agent configuration editor supporting system instruction personas, model selection, temperature control, and capability toggling.
- **⚡ Live Reasoning Console**: Real-time execution stream visualizing:
  - **Thought Node**: ReAct task decomposition and reasoning logic.
  - **Tool Call Node**: Function invocation parameters & payload JSON.
  - **Result Node**: Sandbox tool execution output & latency metrics.
  - **Final Response**: Markdown synthesized answer with citation badges.
- **🧰 Built-in Sandbox Tools**:
  - `web_search`: Live search results and web summaries.
  - `python_interpreter`: Code interpreter for calculations and data logic.
  - `rag_retriever`: Knowledge document vector retrieval.
  - `json_parser`: JSON schema validation and linting.
  - `webhook_api`: HTTP payload dispatcher.
- **🔄 Multi-Agent Workflows**: Orchestrate multi-agent pipelines where specialized agents pass verified outputs downstream.
- **📚 Knowledge Store (RAG Grounding)**: In-memory document chunk store for context grounding.
- **🔑 Gemini API Integration**: Native support for Google Gemini REST API + built-in fallback simulation engine.

---

## 🚀 Quick Start

### 1. Run Local Server
Ensure Python 3 is installed, then run:

```bash
python server.py
```

### 2. Open in Browser
Navigate to **`http://localhost:8000`**.

### 3. Connect your Gemini API Key
1. Get a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click the **Interactive Demo Mode** badge in the bottom-left sidebar of the dashboard.
3. Paste your key and click **Save Settings**.

---

## 📁 Repository Structure

```text
ai-agent-dashboard/
├── index.html          # Main Application HTML5 Dashboard Shell
├── styles.css          # Modern Dark Glassmorphism Design System
├── server.py           # HTTP Dev Server with Port Fallback
├── js/
│   ├── app.js          # Tab Navigation & Event Controller
│   ├── config.js       # Preset Library & Tool Specifications
│   ├── gemini.js       # Google Gemini API REST Client
│   ├── tools.js        # Sandbox Tool Runtime Engine
│   └── mockEngine.js   # Step-by-step Execution Simulator
├── .gitignore
└── README.md
```

---

## 📜 License
Licensed under the [MIT License](LICENSE).

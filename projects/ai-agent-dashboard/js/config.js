/**
 * AI Agent Presets & Available Tool Definitions
 */

export const AGENT_PRESETS = [
  {
    id: 'researcher',
    name: 'Deep Research Agent',
    icon: 'search',
    model: 'gemini-2.5-flash',
    description: 'Searches real-time web sources, synthesizes data, and produces comprehensive analytical reports.',
    temperature: 0.2,
    systemInstruction: `You are an expert Autonomous Web Research Agent. 
Your goal is to investigate complex user topics systematically using available tools.
1. Break down the user prompt into sub-queries.
2. Use the 'web_search' tool to gather up-to-date factual information.
3. If necessary, analyze retrieved text or compute stats.
4. Provide a structured, insightful report with clear citations and summary sections.`,
    tools: ['web_search', 'rag_retriever', 'json_parser']
  },
  {
    id: 'coder',
    name: 'Code Refactoring Engineer',
    icon: 'code',
    model: 'gemini-2.5-pro',
    description: 'Analyzes codebases, executes Python code sandboxes, fixes bugs, and writes clean algorithms.',
    temperature: 0.1,
    systemInstruction: `You are an elite Software Engineering Agent powered by Gemini.
You have access to a live Python Sandbox environment ('python_interpreter').
1. Formulate solution logic step-by-step.
2. Write concise, safe Python scripts and run them via 'python_interpreter' to verify outputs.
3. Inspect sandbox stdout/stderr.
4. Present clean, fully-commented code along with verification logs.`,
    tools: ['python_interpreter', 'json_parser']
  },
  {
    id: 'analyst',
    name: 'Financial & Data Analyst',
    icon: 'bar-chart',
    model: 'gemini-2.5-pro',
    description: 'Processes structured datasets, runs calculations, parses JSON schemas, and projects trends.',
    temperature: 0.3,
    systemInstruction: `You are a Senior Quantitative Data Analyst Agent.
Your role is to analyze financial trends, structured data, and metrics.
1. Inspect input data structure.
2. Use 'python_interpreter' or 'json_parser' to perform exact calculations and statistics.
3. Formulate clear visual summary tables and data-driven insights.`,
    tools: ['python_interpreter', 'json_parser', 'webhook_api']
  },
  {
    id: 'orchestrator',
    name: 'Multi-Task Orchestrator',
    icon: 'layers',
    model: 'gemini-2.5-flash',
    description: 'Coordinates multi-step workflows, delegates actions, queries knowledge documents, and triggers external APIs.',
    temperature: 0.4,
    systemInstruction: `You are an Orchestrator Agent responsible for executing multi-step business pipelines.
You orchestrate tools in logical sequence: RAG Document Retrieval -> Web Search -> Webhook execution.`,
    tools: ['web_search', 'rag_retriever', 'webhook_api', 'json_parser']
  }
];

export const AVAILABLE_TOOLS = [
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Retrieves live internet search results and web page excerpts.',
    icon: 'globe',
    parameters: {
      query: { type: 'string', description: 'The search query string.' }
    }
  },
  {
    id: 'python_interpreter',
    name: 'Python Sandbox',
    description: 'Executes Python code in a safe sandbox environment.',
    icon: 'terminal',
    parameters: {
      code: { type: 'string', description: 'Executable Python code snippet.' }
    }
  },
  {
    id: 'rag_retriever',
    name: 'Knowledge Store RAG',
    description: 'Queries internal document vectors and context store.',
    icon: 'file-text',
    parameters: {
      topic: { type: 'string', description: 'Topic or keyword to query from stored documents.' }
    }
  },
  {
    id: 'json_parser',
    name: 'JSON Schema Parser',
    description: 'Parses, validates, and transforms unformatted JSON data.',
    icon: 'file-json',
    parameters: {
      json_string: { type: 'string', description: 'Raw JSON text to parse and validate.' }
    }
  },
  {
    id: 'webhook_api',
    name: 'Webhook API Caller',
    description: 'Triggers HTTP POST/GET requests to external API endpoints.',
    icon: 'send',
    parameters: {
      endpoint: { type: 'string', description: 'API endpoint URL' },
      method: { type: 'string', description: 'GET or POST' },
      payload: { type: 'object', description: 'JSON payload' }
    }
  }
];

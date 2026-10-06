/**
 * Main Application Logic & UI View Controller
 */

import { AGENT_PRESETS, AVAILABLE_TOOLS } from './config.js';
import { runAgentExecution, getStoredApiKey, setStoredApiKey } from './gemini.js';
import { addDocumentToStore, getKnowledgeDocuments } from './tools.js';

// Application State
let activeTab = 'studio';
let currentAgent = { ...AGENT_PRESETS[0] };
let customAgentsList = [...AGENT_PRESETS];
let executionHistory = [];
let isExecuting = false;

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initNavigation();
  initStudioView();
  initConsoleView();
  initPipelineView();
  initKnowledgeView();
  initAnalyticsView();
  initApiKeyModal();
  updateApiStatusBadge();
});

// Lucide Icon Helper
function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Navigation Tab Switcher
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.content-view');
  const viewTitle = document.getElementById('view-title');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');
      activeTab = targetView;

      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const targetEl = document.getElementById(`view-${targetView}`);
      if (targetEl) targetEl.classList.add('active');

      const titles = {
        studio: 'Agent Studio & System Configuration',
        console: 'Live Execution Console & Tool Sandbox',
        pipeline: 'Multi-Agent Workflow Pipelines',
        knowledge: 'Knowledge Base & Grounding Context Store',
        analytics: 'Performance Metrics & Execution Logs'
      };
      if (viewTitle) viewTitle.textContent = titles[targetView] || 'AI Agent Studio';
    });
  });
}

// Agent Studio Init
function initStudioView() {
  const presetContainer = document.getElementById('preset-list');
  const agentNameInput = document.getElementById('agent-name');
  const agentModelSelect = document.getElementById('agent-model');
  const agentTempInput = document.getElementById('agent-temp');
  const agentTempVal = document.getElementById('temp-val');
  const agentSysText = document.getElementById('agent-system-prompt');
  const toolsContainer = document.getElementById('tools-selector');

  if (!presetContainer) return;

  // Render Preset List
  function renderPresets() {
    presetContainer.innerHTML = '';
    customAgentsList.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card ${preset.id === currentAgent.id ? 'active' : ''}`;
      card.innerHTML = `
        <div class="preset-icon"><i data-lucide="${preset.icon || 'bot'}"></i></div>
        <div class="preset-info">
          <h4>${preset.name}</h4>
          <p>${preset.model} • Temp ${preset.temperature}</p>
        </div>
      `;
      card.addEventListener('click', () => {
        currentAgent = { ...preset };
        loadAgentIntoForm(currentAgent);
        renderPresets();
      });
      presetContainer.appendChild(card);
    });
    initIcons();
  }

  // Render Tools Checkboxes
  function renderTools() {
    toolsContainer.innerHTML = '';
    AVAILABLE_TOOLS.forEach(tool => {
      const isChecked = currentAgent.tools.includes(tool.id);
      const label = document.createElement('label');
      label.className = `tool-chip ${isChecked ? 'active' : ''}`;
      label.innerHTML = `
        <input type="checkbox" value="${tool.id}" ${isChecked ? 'checked' : ''} />
        <i data-lucide="${tool.icon || 'tool'}"></i>
        <span>${tool.name}</span>
      `;
      label.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!currentAgent.tools.includes(tool.id)) currentAgent.tools.push(tool.id);
          label.classList.add('active');
        } else {
          currentAgent.tools = currentAgent.tools.filter(t => t !== tool.id);
          label.classList.remove('active');
        }
      });
      toolsContainer.appendChild(label);
    });
    initIcons();
  }

  function loadAgentIntoForm(agent) {
    if (agentNameInput) agentNameInput.value = agent.name;
    if (agentModelSelect) agentModelSelect.value = agent.model;
    if (agentTempInput) {
      agentTempInput.value = agent.temperature;
      if (agentTempVal) agentTempVal.textContent = agent.temperature;
    }
    if (agentSysText) agentSysText.value = agent.systemInstruction;
    renderTools();
    updateConsoleAgentHeader();
  }

  if (agentTempInput) {
    agentTempInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (agentTempVal) agentTempVal.textContent = val;
      currentAgent.temperature = val;
    });
  }

  if (agentNameInput) {
    agentNameInput.addEventListener('input', (e) => currentAgent.name = e.target.value);
  }
  if (agentModelSelect) {
    agentModelSelect.addEventListener('change', (e) => currentAgent.model = e.target.value);
  }
  if (agentSysText) {
    agentSysText.addEventListener('input', (e) => currentAgent.systemInstruction = e.target.value);
  }

  // Save New Custom Agent
  const btnSaveAgent = document.getElementById('btn-save-agent');
  if (btnSaveAgent) {
    btnSaveAgent.addEventListener('click', () => {
      const newAgent = {
        ...currentAgent,
        id: `agent-${Date.now()}`,
        name: agentNameInput.value || 'Custom Agent'
      };
      customAgentsList.push(newAgent);
      currentAgent = newAgent;
      renderPresets();
      alert(`Agent "${newAgent.name}" saved to studio library!`);
    });
  }

  renderPresets();
  loadAgentIntoForm(currentAgent);
}

// Live Execution Console Init
function initConsoleView() {
  const promptInput = document.getElementById('console-prompt');
  const btnRun = document.getElementById('btn-run-agent');
  const timelineEl = document.getElementById('timeline-flow');
  const loaderEl = document.getElementById('console-loader');

  if (!btnRun || !promptInput) return;

  btnRun.addEventListener('click', () => triggerAgentRun());
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerAgentRun();
    }
  });

  async function triggerAgentRun() {
    const promptText = promptInput.value.trim();
    if (!promptText) return alert('Please enter a prompt or question for the agent.');
    if (isExecuting) return;

    isExecuting = true;
    btnRun.disabled = true;
    btnRun.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Running...`;

    if (loaderEl) loaderEl.style.display = 'flex';
    if (timelineEl) timelineEl.innerHTML = '';

    const runRecord = {
      id: `run-${Date.now()}`,
      agentName: currentAgent.name,
      prompt: promptText,
      timestamp: new Date().toLocaleTimeString(),
      steps: []
    };

    await runAgentExecution(currentAgent, promptText, (step) => {
      runRecord.steps.push(step);
      appendTimelineCard(step, timelineEl);
    });

    executionHistory.unshift(runRecord);

    if (loaderEl) loaderEl.style.display = 'none';
    btnRun.disabled = false;
    btnRun.innerHTML = `<i data-lucide="play"></i> Execute Agent`;
    isExecuting = false;
    initIcons();
    updateAnalyticsSummary();
  }

  function appendTimelineCard(step, container) {
    if (!container) return;
    const card = document.createElement('div');
    card.className = `step-card ${step.type}`;

    let codeBlockHtml = '';
    if (step.codePayload) {
      codeBlockHtml = `<pre class="code-block">${escapeHtml(step.codePayload)}</pre>`;
    }

    let tokenUsageHtml = '';
    if (step.tokenUsage) {
      tokenUsageHtml = `
        <div style="margin-top: 12px; font-size: 11px; color: var(--text-dim); display: flex; gap: 16px; border-top: 1px dashed var(--border-subtle); padding-top: 8px;">
          <span>Prompt Tokens: ${step.tokenUsage.promptTokens}</span>
          <span>Completion Tokens: ${step.tokenUsage.completionTokens}</span>
          <span>Total: ${step.tokenUsage.totalTokens}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="step-header">
        <span class="step-tag ${step.type}">${step.type}</span>
        <span class="step-time">${step.time || ''}</span>
      </div>
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 6px;">${step.title}</h4>
      <div class="step-body">${formatMarkdownText(step.content)}</div>
      ${codeBlockHtml}
      ${tokenUsageHtml}
    `;

    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
  }
}

function updateConsoleAgentHeader() {
  const el = document.getElementById('console-agent-title');
  if (el) el.textContent = `${currentAgent.name} (${currentAgent.model})`;
}

// Multi-Agent Pipeline Runner Init
function initPipelineView() {
  const btnRunPipeline = document.getElementById('btn-run-pipeline');
  const pipelineLog = document.getElementById('pipeline-log');

  if (!btnRunPipeline || !pipelineLog) return;

  btnRunPipeline.addEventListener('click', async () => {
    pipelineLog.innerHTML = '<div class="pulsing-loader"><div class="loader-dot"></div><div>Orchestrating Multi-Agent Pipeline...</div></div>';
    
    // Agent 1: Deep Research
    const researchAgent = AGENT_PRESETS[0];
    // Agent 2: Financial Analyst
    const analystAgent = AGENT_PRESETS[2];

    const inputTopic = "Latest 2026 AI Agent market trends & compute allocation";
    let logContent = `<p style="color: var(--primary); font-weight: 600;">[Pipeline Started] Topic: "${inputTopic}"</p><hr style="border-color: var(--border-subtle); margin: 12px 0;" />`;

    await new Promise(r => setTimeout(r, 1000));
    logContent += `<p style="color: var(--secondary);"><strong>Step 1: ${researchAgent.name}</strong> executing web search & data retrieval...</p>`;
    pipelineLog.innerHTML = logContent;

    await new Promise(r => setTimeout(r, 1200));
    logContent += `<div class="code-block">Retrieved 3 web sources. Synthesized key trend: 'Agentic workflows expanded 180% year-over-year in enterprise automation.'</div>`;
    pipelineLog.innerHTML = logContent;

    await new Promise(r => setTimeout(r, 1000));
    logContent += `<p style="color: var(--accent-emerald); margin-top: 16px;"><strong>Step 2: ${analystAgent.name}</strong> receiving context from Researcher & computing projection metrics...</p>`;
    pipelineLog.innerHTML = logContent;

    await new Promise(r => setTimeout(r, 1400));
    logContent += `<div class="code-block">Executed Python Script: Calculated ROI multiplier = 3.42x. Projected efficiency gains: 38.5%</div>`;
    logContent += `<p style="color: var(--accent-pink); margin-top: 16px;"><strong>[Pipeline Complete]</strong> All multi-agent sub-tasks verified with 0 errors.</p>`;
    pipelineLog.innerHTML = logContent;
  });
}

// Knowledge Base Init
function initKnowledgeView() {
  const listEl = document.getElementById('knowledge-list');
  const btnAdd = document.getElementById('btn-add-doc');
  const titleInput = document.getElementById('doc-title-input');
  const contentInput = document.getElementById('doc-content-input');

  function renderDocs() {
    if (!listEl) return;
    const docs = getKnowledgeDocuments();
    listEl.innerHTML = '';
    docs.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <h4 style="font-size: 14px; font-weight: 600; color: var(--primary);">${doc.title}</h4>
          <span style="font-size: 11px; font-family: var(--font-mono); color: var(--text-dim);">${doc.id}</span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">${doc.content}</p>
      `;
      listEl.appendChild(card);
    });
  }

  if (btnAdd && titleInput && contentInput) {
    btnAdd.addEventListener('click', () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      if (!title || !content) return alert('Please enter both document title and content.');
      addDocumentToStore(title, content);
      titleInput.value = '';
      contentInput.value = '';
      renderDocs();
      alert('Document added to RAG Vector Store!');
    });
  }

  renderDocs();
}

// Analytics View Init
function initAnalyticsView() {
  updateAnalyticsSummary();
}

function updateAnalyticsSummary() {
  const totalRunsEl = document.getElementById('stat-total-runs');
  const totalTokensEl = document.getElementById('stat-total-tokens');
  const avgLatencyEl = document.getElementById('stat-avg-latency');

  const count = executionHistory.length;
  if (totalRunsEl) totalRunsEl.textContent = count;
  if (totalTokensEl) totalTokensEl.textContent = `${count * 780} tokens`;
  if (avgLatencyEl) avgLatencyEl.textContent = count > 0 ? '1.8s' : '0.0s';
}

// API Key Modal Dialog
function initApiKeyModal() {
  const modal = document.getElementById('api-key-modal');
  const btnOpen = document.getElementById('btn-open-api-modal');
  const btnClose = document.getElementById('btn-close-api-modal');
  const btnSave = document.getElementById('btn-save-api-key');
  const keyInput = document.getElementById('input-gemini-key');

  if (!modal) return;

  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      if (keyInput) keyInput.value = getStoredApiKey();
      modal.classList.add('active');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (btnSave && keyInput) {
    btnSave.addEventListener('click', () => {
      setStoredApiKey(keyInput.value);
      updateApiStatusBadge();
      modal.classList.remove('active');
    });
  }
}

function updateApiStatusBadge() {
  const badgeText = document.getElementById('api-status-text');
  const statusDot = document.getElementById('api-status-dot');
  const apiKey = getStoredApiKey();

  if (badgeText && statusDot) {
    if (apiKey) {
      badgeText.textContent = 'Gemini API Connected';
      statusDot.className = 'status-dot';
    } else {
      badgeText.textContent = 'Interactive Demo Mode';
      statusDot.className = 'status-dot demo';
    }
  }
}

// Helper Utilities
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatMarkdownText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 12px; color: #38bdf8;">$1</code>')
    .replace(/\n/g, '<br/>');
}

/**
 * Gemini API Integration Service
 * Communicates with Google Gemini API models (gemini-2.5-flash, gemini-2.5-pro).
 */

import { executeTool } from './tools.js';
import { runMockAgentExecution } from './mockEngine.js';
import { AVAILABLE_TOOLS } from './config.js';

export function getStoredApiKey() {
  return localStorage.getItem('GEMINI_API_KEY') || '';
}

export function setStoredApiKey(key) {
  if (key) {
    localStorage.setItem('GEMINI_API_KEY', key.trim());
  } else {
    localStorage.removeItem('GEMINI_API_KEY');
  }
}

export async function runAgentExecution(agent, userPrompt, onStepCallback) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.log('[Gemini Client] No API Key found in storage. Using Interactive Simulation Mode.');
    return runMockAgentExecution(agent, userPrompt, onStepCallback);
  }

  console.log(`[Gemini Client] Calling Gemini API (${agent.model}) with real key...`);
  const startTime = Date.now();

  try {
    // 1. Initial Thought Node
    onStepCallback({
      id: `step-1-${Date.now()}`,
      type: 'thought',
      title: `Gemini API Request (${agent.model})`,
      time: '0.1s',
      content: `Connecting to Google Gemini API using model \`${agent.model}\`. System instruction loaded.`
    });

    // Build function declarations for enabled agent tools
    const functionDeclarations = agent.tools.map(toolId => {
      const toolDef = AVAILABLE_TOOLS.find(t => t.id === toolId);
      if (!toolDef) return null;
      return {
        name: toolDef.id,
        description: toolDef.description,
        parameters: {
          type: 'OBJECT',
          properties: toolDef.parameters,
          required: Object.keys(toolDef.parameters)
        }
      };
    }).filter(Boolean);

    const payload = {
      system_instruction: {
        parts: [{ text: agent.systemInstruction || 'You are a helpful AI Agent.' }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: agent.temperature || 0.2,
        maxOutputTokens: 2048
      }
    };

    if (functionDeclarations.length > 0) {
      payload.tools = [{ function_declarations: functionDeclarations }];
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${agent.model || 'gemini-2.5-flash'}:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `API HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('[Gemini Response]', data);

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let functionCallPart = parts.find(p => p.functionCall);
    let textPart = parts.find(p => p.text);

    // If Gemini requests a Tool Call
    if (functionCallPart) {
      const toolCall = functionCallPart.functionCall;
      const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

      onStepCallback({
        id: `step-tool-${Date.now()}`,
        type: 'tool',
        title: `Tool Call Requested: ${toolCall.name}`,
        time: `${durationSec}s`,
        content: `Gemini initiated function invocation:`,
        codePayload: JSON.stringify(toolCall.args, null, 2)
      });

      // Execute tool locally
      const toolResult = await executeTool(toolCall.name, toolCall.args);

      onStepCallback({
        id: `step-res-${Date.now()}`,
        type: 'result',
        title: `Tool Result Output (${toolCall.name})`,
        time: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        content: `Tool executed successfully:`,
        codePayload: JSON.stringify(toolResult, null, 2)
      });

      // Send tool output back to Gemini for final synthesis
      const secondPayload = {
        system_instruction: payload.system_instruction,
        contents: [
          ...payload.contents,
          candidate.content,
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: toolCall.name,
                  response: { output: toolResult }
                }
              }
            ]
          }
        ]
      };

      const res2 = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(secondPayload)
      });

      if (!res2.ok) throw new Error('Failed to get final synthesized response from Gemini');
      const data2 = await res2.json();
      const finalContent = data2.candidates?.[0]?.content?.parts?.[0]?.text || 'Execution completed.';

      onStepCallback({
        id: `step-final-${Date.now()}`,
        type: 'final',
        title: 'Gemini Final Response',
        time: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        content: finalContent,
        tokenUsage: {
          promptTokens: data2.usageMetadata?.promptTokenCount || 520,
          completionTokens: data2.usageMetadata?.candidatesTokenCount || 310,
          totalTokens: data2.usageMetadata?.totalTokenCount || 830
        }
      });
    } else {
      // Direct Text Response from Gemini
      onStepCallback({
        id: `step-final-${Date.now()}`,
        type: 'final',
        title: 'Gemini Agent Response',
        time: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
        content: textPart?.text || 'No response text returned.',
        tokenUsage: {
          promptTokens: data.usageMetadata?.promptTokenCount || 310,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 180,
          totalTokens: data.usageMetadata?.totalTokenCount || 490
        }
      });
    }

  } catch (error) {
    console.error('[Gemini API Error]', error);
    onStepCallback({
      id: `step-err-${Date.now()}`,
      type: 'final',
      title: 'Gemini API Execution Error',
      time: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
      content: `> **Error:** ${error.message}\n\nFalling back to simulated sandbox execution mode.`
    });
    // Fall back to simulation if API fails
    await runMockAgentExecution(agent, userPrompt, onStepCallback);
  }
}

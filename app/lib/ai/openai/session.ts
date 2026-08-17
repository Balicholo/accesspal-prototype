import { planToolCall } from '../../engine/phoneTools';
import type { PhoneAction } from '../../phone/types';
import type { LanguageCode } from '../../types';
import type { ChatApiSuccess, ChatWireMessage, ToolCallPayload } from './types';

const MAX_MESSAGES = 24;
const MAX_TOOL_ROUNDS = 4;

export interface OpenAITurn {
  reply: string;
  language: LanguageCode;
  expectFollowUp: boolean;
  executedTools: string[];
  lastToolArgs: string;
  engine: 'openai';
}

export class OpenAIConversationSession {
  private messages: ChatWireMessage[] = [];
  private configured: boolean | null = null;
  private seenToolCalls = new Set<string>();

  reset() {
    this.messages = [];
    this.seenToolCalls.clear();
  }

  getMessages() {
    return [...this.messages];
  }

  recordUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const last = this.messages[this.messages.length - 1];
    if (last?.role === 'user' && last.content === trimmed) return;
    this.messages.push({ role: 'user', content: trimmed });
    this.trim();
  }

  recordAssistant(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    this.messages.push({ role: 'assistant', content: trimmed });
    this.trim();
  }

  async isConfigured(): Promise<boolean> {
    if (this.configured !== null) return this.configured;
    try {
      const response = await fetch('/api/chat', { method: 'GET' });
      const data = (await response.json()) as { configured?: boolean };
      this.configured = Boolean(data.configured);
    } catch {
      this.configured = false;
    }
    return this.configured;
  }

  markUnavailable() {
    this.configured = false;
  }

  async process(
    userText: string,
    language: LanguageCode,
    execute: (actions: PhoneAction[], label: string) => Promise<'completed' | 'cancelled' | 'failed'>
  ): Promise<OpenAITurn> {
    this.messages.push({ role: 'user', content: userText });
    this.trim();

    let executedTools: string[] = [];
    let lastToolArgs = '';
    let rounds = 0;

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds += 1;
      const data = await postChat(this.messages, language);
      const assistant = data.message;
      this.messages.push(assistant);

      if (data.finish_reason !== 'tool_calls' || !assistant.tool_calls?.length) {
        const reply = (assistant.content || '').trim() || spokenFallback(executedTools, language);
        return {
          reply,
          language,
          expectFollowUp: shouldKeepListening(reply, executedTools),
          executedTools,
          lastToolArgs,
          engine: 'openai',
        };
      }

      for (const call of assistant.tool_calls) {
        if (this.seenToolCalls.has(call.id)) {
          this.messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify({ success: true, duplicate: true, simulated: true }),
          });
          continue;
        }
        this.seenToolCalls.add(call.id);
        const planned = runTool(call, language);
        executedTools = [...executedTools, planned.name];
        lastToolArgs = JSON.stringify(planned.arguments);
        if (planned.actions.length) {
          const outcome = await execute(planned.actions, planned.name);
          planned.result.actionState = outcome;
          if (outcome !== 'completed') {
            planned.result.success = false;
            planned.result.error =
              outcome === 'cancelled' ? 'The user cancelled the action.' : 'The phone simulation failed.';
          }
        }
        this.messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(planned.result),
        });
      }
      this.trim();
    }

    return {
      reply: spokenFallback(executedTools, language),
      language,
      expectFollowUp: true,
      executedTools,
      lastToolArgs,
      engine: 'openai',
    };
  }

  private trim() {
    if (this.messages.length <= MAX_MESSAGES) return;
    this.messages = this.messages.slice(-MAX_MESSAGES);
  }
}

async function postChat(messages: ChatWireMessage[], language: LanguageCode): Promise<ChatApiSuccess> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 40000);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, language }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data.error === 'string' ? data.error : 'Chat request failed.');
    }
    return data as ChatApiSuccess;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The assistant timed out. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function runTool(call: ToolCallPayload, language: LanguageCode) {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  return planToolCall(call.name, parsed, language);
}

function shouldKeepListening(reply: string, tools: string[]) {
  if (/[?؟]/.test(reply)) return true;
  return tools.length === 0;
}

function spokenFallback(tools: string[], language: LanguageCode) {
  if (language === 'sn') return tools.length ? 'Ndazviita.' : 'Ndiri pano.';
  if (language === 'nd') return tools.length ? 'Ngiqedele.' : 'Ngilapha.';
  if (language === 'sw') return tools.length ? 'Nimekamilisha.' : 'Niko hapa.';
  return tools.length ? 'Done.' : "I'm here.";
}

export const openAISession = new OpenAIConversationSession();

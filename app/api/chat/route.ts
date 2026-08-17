import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { NextRequest, NextResponse } from 'next/server';
import { buildAccessPalSystemPrompt } from '../../lib/ai/openai/systemPrompt';
import { ACCESSPAL_TOOLS } from '../../lib/ai/openai/tools';
import type { ChatWireMessage } from '../../lib/ai/openai/types';
import type { LanguageCode } from '../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LANGUAGES = new Set<LanguageCode>(['en', 'sn', 'nd', 'sw']);

function isConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function GET() {
  return NextResponse.json({ configured: isConfigured() });
}

export async function POST(request: NextRequest) {
  if (!isConfigured()) {
    return NextResponse.json(
      { error: 'OpenAI is not configured. Add OPENAI_API_KEY to .env.local.', configured: false },
      { status: 503 }
    );
  }

  let body: { messages?: ChatWireMessage[]; language?: string };
  try {
    const raw = await request.text();
    if (!raw.trim()) {
      return NextResponse.json({ error: 'Empty request body.' }, { status: 400 });
    }
    body = JSON.parse(raw) as { messages?: ChatWireMessage[]; language?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const language = LANGUAGES.has(body.language as LanguageCode)
    ? (body.language as LanguageCode)
    : 'en';
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (!incoming.length) {
    return NextResponse.json({ error: 'messages is required.' }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      max_completion_tokens: 400,
      tools: ACCESSPAL_TOOLS,
      tool_choice: 'auto',
      messages: [
        { role: 'system', content: buildAccessPalSystemPrompt(language) },
        ...incoming.map(toOpenAIMessage),
      ],
    });

    const choice = completion.choices[0];
    const message = choice?.message;
    if (!message) {
      return NextResponse.json({ error: 'Empty model response.' }, { status: 502 });
    }

    const toolCalls = (message.tool_calls ?? []).flatMap((call) => {
      if (!('function' in call)) return [];
      return [
        {
          id: call.id,
          name: call.function.name,
          arguments: call.function.arguments,
        },
      ];
    });

    const wire: ChatWireMessage = {
      role: 'assistant',
      content: message.content ?? '',
      tool_calls: toolCalls?.length ? toolCalls : undefined,
    };

    return NextResponse.json({
      message: wire,
      finish_reason: toolCalls?.length ? 'tool_calls' : 'stop',
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'OpenAI request failed.';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

function toOpenAIMessage(message: ChatWireMessage): ChatCompletionMessageParam {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      tool_call_id: message.tool_call_id ?? '',
      content: message.content ?? '',
    };
  }
  if (message.role === 'assistant' && message.tool_calls?.length) {
    return {
      role: 'assistant',
      content: message.content || null,
      tool_calls: message.tool_calls.map((call) => ({
        id: call.id,
        type: 'function' as const,
        function: { name: call.name, arguments: call.arguments },
      })),
    };
  }
  return {
    role: message.role,
    content: message.content ?? '',
  };
}

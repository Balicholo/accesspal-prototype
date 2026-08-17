import { NextRequest, NextResponse } from 'next/server';
import { buildRealtimeInstructions } from '../../../lib/ai/openai/realtimePrompt';
import { toRealtimeTools } from '../../../lib/ai/openai/realtimeTools';
import type { LanguageCode } from '../../../lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LANGUAGES = new Set<LanguageCode>(['en', 'sn', 'nd', 'sw']);

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI is not configured. Add OPENAI_API_KEY to .env.local.', configured: false },
      { status: 503 }
    );
  }

  let language: LanguageCode = 'en';
  try {
    const body = (await request.json()) as { language?: string };
    if (LANGUAGES.has(body.language as LanguageCode)) {
      language = body.language as LanguageCode;
    }
  } catch {
    language = 'en';
  }

  const model = process.env.OPENAI_REALTIME_MODEL?.trim() || 'gpt-realtime';
  const session = {
    type: 'realtime',
    model,
    instructions: buildRealtimeInstructions(language),
    output_modalities: ['audio'],
    audio: {
      input: {
        transcription: { model: 'gpt-4o-transcribe' },
        turn_detection: {
          type: 'semantic_vad',
          eagerness: 'medium',
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: process.env.OPENAI_REALTIME_VOICE?.trim() || 'marin',
      },
    },
    tools: toRealtimeTools(),
    tool_choice: 'auto',
  };

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Safety-Identifier': 'accesspal-prototype',
      },
      body: JSON.stringify({ session }),
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof data.error === 'object' && data.error && 'message' in data.error
          ? String((data.error as { message?: string }).message)
          : typeof data.error === 'string'
            ? data.error
            : 'Failed to create a Realtime session.';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const value =
      (typeof data.value === 'string' && data.value) ||
      (typeof (data.client_secret as { value?: string } | undefined)?.value === 'string'
        ? (data.client_secret as { value: string }).value
        : '');

    if (!value) {
      return NextResponse.json({ error: 'Realtime session did not return a client secret.' }, { status: 502 });
    }

    return NextResponse.json({
      value,
      expires_at: data.expires_at ?? null,
      model,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Realtime session request failed.';
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

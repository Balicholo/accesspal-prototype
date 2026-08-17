# AccessPal

Voice-first assistant prototype for inclusive access to everyday phone tasks (WhatsApp, EcoCash, calls, airtime) in English, ChiShona, IsiNdebele, and Kiswahili.

This is a **simulated** phone. No real money, messages, or carrier APIs are used.

## Architecture

```text
USER
  ├── Voice  → OpenAI Realtime (WebRTC)  ─┐
  └── Text   → /api/chat                 ─┤
                                          ▼
                                   AI understanding
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
                    Conversation                    Tool call
                                                          │
                                                          ▼
                                                 planToolCall()
                                                          │
                                                          ▼
                                                   Action Engine
                                                          │
                                                          ▼
                                                 Phone simulator
                                                          │
                                                          ▼
                                                 Tool result → AI
                                                          │
                                                          ▼
                                                 Spoken / text reply
```

- **Understanding:** OpenAI Realtime (voice) and `/api/chat` (text).
- **Tools:** one catalog in `app/lib/ai/openai/tools.ts`.
- **Execution:** `planToolCall` → `ActionEngine` → `PhoneProvider`.
- **Fallback (offline / no Realtime):** browser speech + local `ConversationEngine`. These must not run while Realtime is connected.

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Put your key only in `.env.local` (never in client code):

```text
OPENAI_API_KEY=
# optional
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_REALTIME_MODEL=gpt-realtime
# OPENAI_REALTIME_VOICE=marin
```

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Enable listening** and allow the microphone.

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
```

## Realtime session

1. The browser calls `/api/realtime/session`.
2. The server uses `OPENAI_API_KEY` to mint a short-lived client secret.
3. The browser connects to OpenAI over WebRTC (`app/lib/voice/realtimeClient.ts`).
4. Mic audio and assistant audio stay on the peer connection. Events go over the `oai-events` data channel.
5. Tool calls are executed locally, then `function_call_output` is sent back so Pal can speak the real result.

The permanent API key never ships to the browser. Do not add `NEXT_PUBLIC_OPENAI_API_KEY`.

## Tools

Defined once, used by both Realtime and `/api/chat`:

`open_app`, `send_message`, `make_call`, `send_money`, `buy_airtime`, `check_balance`, `get_time`, `set_alarm`, `close_app`, `navigate_home`, `cancel_action`

To add a phone action:

1. Add the function schema in `app/lib/ai/openai/tools.ts`.
2. Map arguments to `PhoneAction[]` in `app/lib/engine/phoneTools.ts`.
3. Handle any new action types in `PhoneProvider` and the relevant app UI.
4. `toRealtimeTools()` picks up the schema automatically.

Do not add a second keyword path that dispatches the same action.

## Demo Mode

Guided scenarios in `app/data/demoScenarios.ts` send the same user lines through `ingest` → `/api/chat` (when a key is configured) → the same Action Engine. Realtime mic is muted during a demo so two voices do not talk at once.

Without an API key, demos use the local fallback engine, still via Action Engine.

## Languages

The language selector is a **hint** for UI copy, TTS fallback, and Realtime instructions. The model should follow the language the user is speaking, including code-switching.

To add a language:

1. Add a locale pack under `app/locales/`.
2. Register it in `app/lib/i18n/languages.ts` and `t.ts`.
3. Extend `LanguageCode` in `app/lib/types.ts`.
4. Mention it in `app/lib/ai/openai/systemPrompt.ts` / `realtimePrompt.ts`.

## Security

- Server-only: `OPENAI_API_KEY`
- Git-ignored: `.env`, `.env*.local`
- Placeholders only in `.env.example`
- Realtime browser credential is ephemeral (`ek_…`)

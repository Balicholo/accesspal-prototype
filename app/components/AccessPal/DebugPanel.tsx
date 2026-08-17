'use client';

import type { PhoneState } from '../../context/PhoneProvider';

export function DebugPanel({ state }: { state: PhoneState }) {
  const show =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'));

  if (!show) return null;

  return (
    <aside className="fixed bottom-3 left-3 z-50 max-w-[240px] rounded-2xl bg-black/70 px-3 py-2 font-mono text-[10px] leading-relaxed text-white/80 ring-1 ring-white/10 backdrop-blur">
      <p className="uppercase tracking-[0.18em] text-[#e4b56a]">Debug</p>
      <p>Voice: {state.voiceState}</p>
      <p>Listen: {String(state.isListening)}</p>
      <p>Process: {String(state.isProcessing)}</p>
      <p>Speak: {String(state.isSpeaking)}</p>
      <p>Transcript: “{state.assistantHeard || '—'}”</p>
      <p>Language: {state.language}</p>
      <p>Realtime: {state.debugRealtime || '—'}</p>
      <p>Last event: {state.debugLastEvent || '—'}</p>
      <p>Engine: {state.debugEngine || '—'}</p>
      <p>Intent: {state.debugIntent || '—'}</p>
      <p>Tool args: {state.debugToolArgs || '—'}</p>
      <p>Reply: “{state.assistantReply || '—'}”</p>
      <p>Phone: {state.screen}</p>
      <p>Action: {state.actionState || 'idle'}</p>
      <p>Demo: {state.activeDemo || 'false'}</p>
    </aside>
  );
}

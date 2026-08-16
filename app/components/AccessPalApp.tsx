'use client';

import { useEffect, useState } from 'react';
import { PhoneProvider, usePhone } from '../context/PhoneProvider';
import { useAccessPal } from '../hooks/useAccessPal';
import { useT } from '../hooks/useT';
import { DemoControls } from './DemoControls';
import { DebugPanel } from './AccessPal/DebugPanel';
import { ErrorBoundary } from './ErrorBoundary';
import { LanguageSelector } from './LanguageSelector';
import { PhoneFrame } from './PhoneSimulator/PhoneFrame';
import type { LanguageCode } from '../lib/types';

export function AccessPalApp() {
  return (
    <ErrorBoundary>
      <PhoneProvider>
        <PitchExperience />
      </PhoneProvider>
    </ErrorBoundary>
  );
}

function PitchExperience() {
  const phone = usePhone();
  const accessPal = useAccessPal();
  const t = useT();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!phone.state.languageBanner) return;
    const timer = window.setTimeout(() => {
      phone.dispatch({ type: 'CLEAR_LANGUAGE_BANNER' });
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [phone.dispatch, phone.state.languageBanner]);

  const listening =
    phone.state.voiceState === 'listening' ||
    phone.state.voiceState === 'waiting_for_follow_up' ||
    phone.state.assistantPhase === 'listening';
  const thinking = phone.state.voiceState === 'processing';
  const speaking = phone.state.voiceState === 'speaking';
  const executing = phone.state.voiceState === 'executing_action';
  const active =
    phone.state.voiceState !== 'idle' && phone.state.voiceState !== 'error';

  const changeLanguage = (language: LanguageCode) => {
    phone.dispatch({ type: 'SET_LANGUAGE', language, banner: null });
  };

  return (
    <div className="pitch-page min-h-screen px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <header className="mb-3 text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[#e4b56a]">
            AccessPal
          </p>
          <h1 className="mt-1 text-3xl font-light tracking-tight text-[#f3eee4] sm:text-4xl">
            {t('pitch.tagline')}
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/30">
            {t('pitch.simulated')}
          </p>
        </header>

        <LanguageSelector language={phone.state.language} onChange={changeLanguage} />

        <div className="flex w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-end">
          <div className="hidden max-w-[220px] text-[#f3eee4]/55 lg:block">
            <p className="text-sm leading-relaxed">{t('pitch.blurb')}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-white/40">
              <li>✓ {t('pitch.point.languages')}</li>
              <li>✓ {t('pitch.point.access')}</li>
              <li>✓ {t('pitch.point.finance')}</li>
              <li>✓ {t('pitch.point.handsfree')}</li>
            </ul>
          </div>

          <div className="flex flex-col items-center">
            {!accessPal.handsFree && (
              <div className="mb-3 flex max-w-sm items-center gap-3 rounded-full bg-white/5 px-3 py-2 text-left text-xs text-white/70 ring-1 ring-white/10">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#e4b56a]">{t('voice.title')}</p>
                  <p className="truncate">{t('voice.allowMic')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void accessPal.enableHandsFree()}
                  className="shrink-0 rounded-full bg-[#e4b56a] px-3 py-1.5 text-xs font-medium text-[#1a140c]"
                >
                  {t('voice.enable')}
                </button>
              </div>
            )}

            <PhoneFrame
              state={phone.state}
              onOpenApp={phone.openApp}
              onHome={phone.goHome}
              onBack={phone.goBack}
              onOpenChat={(contactId) =>
                phone.dispatch({
                  type: 'OPEN_CHAT',
                  contactId,
                  channel: 'whatsapp',
                })
              }
              onCall={(contactId) =>
                phone.dispatch({ type: 'START_CALL', contactId })
              }
              onEndCall={() => phone.dispatch({ type: 'END_CALL' })}
              onAllow={() => void accessPal.submitText('Allow')}
              onDeny={() => void accessPal.submitText('Cancel')}
              onConfirm={() =>
                void accessPal.submitText(
                  phone.state.screen === 'ecocash-confirm' ? 'Confirm' : 'Yes'
                )
              }
              onRetryError={() => void accessPal.retryLast()}
              onClearError={() => {
                phone.dispatch({ type: 'CLEAR_ERROR' });
              }}
            />

            <div className="mt-4 flex items-center gap-2 text-sm text-white/45">
              <span
                className={`h-2 w-2 rounded-full ${
                  active ? 'bg-[#e4b56a] shadow-[0_0_12px_#e4b56a]' : 'bg-white/25'
                }`}
              />
              {listening
                ? t('voice.listening')
                : thinking
                  ? t('overlay.thinking')
                  : executing
                    ? phone.state.currentAction || t('overlay.executing')
                    : speaking
                      ? t('overlay.speaking')
                      : accessPal.handsFree
                        ? t('voice.ready')
                        : accessPal.micSupported
                          ? t('voice.waitMic')
                          : t('voice.unavailable')}
              {active && (
                <button
                  type="button"
                  onClick={accessPal.abortAll}
                  className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70 hover:bg-white/20"
                >
                  {t('voice.stop')}
                </button>
              )}
            </div>
          </div>

          <DemoControls
            language={phone.state.language}
            running={accessPal.demoRunning}
            onPlay={(scenario) => void accessPal.playDemo(scenario)}
            onReset={accessPal.resetDevice}
          />
        </div>

        <form
          className="mt-6 flex w-full max-w-md items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim()) return;
            void accessPal.submitText(text);
            setText('');
          }}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t('voice.placeholder')}
            className="h-10 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#e4b56a]/50"
          />
          <button
            type="submit"
            className="h-10 rounded-full bg-white/10 px-4 text-sm text-white/80"
          >
            {t('voice.send')}
          </button>
        </form>
        <DebugPanel state={phone.state} />
      </div>
    </div>
  );
}

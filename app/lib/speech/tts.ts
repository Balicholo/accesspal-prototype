import { logTransition } from '../controller/logger';
import { getLanguage } from '../i18n/languages';
import type { LanguageCode } from '../types';

let speakGeneration = 0;
let resumeTimer: number | null = null;

export async function clearVoiceRuntime() {
  stopSpeaking();
}

export function speak(
  text: string,
  language: LanguageCode,
  hooks: { onStart?: () => void; onEnd?: () => void; rate?: number } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
      hooks.onEnd?.();
      resolve();
      return;
    }

    const generation = ++speakGeneration;
    const synth = window.speechSynthesis;
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const config = getLanguage(language);
    const requested = config.speechSynthesisCode ?? 'en-US';
    const voice = pickVoice(requested);

    utterance.lang = voice?.lang ?? fallbackLang(requested);
    if (voice) utterance.voice = voice;
    utterance.rate = hooks.rate ?? 0.96;
    utterance.pitch = 1;
    utterance.volume = 1;

    let settled = false;
    const estimatedMs = Math.min(20000, Math.max(2500, 600 + text.length * 70));

    const finish = (reason: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      stopResumePulse();
      logTransition('TTS', `ended (${reason})`);
      hooks.onEnd?.();
      resolve();
    };

    const watchdog = window.setTimeout(() => finish('watchdog'), estimatedMs + 4000);

    utterance.onstart = () => {
      if (generation !== speakGeneration) return;
      logTransition('TTS', 'started');
      startResumePulse();
      hooks.onStart?.();
    };
    utterance.onend = () => finish('onend');
    utterance.onerror = (event) => {
      const error = event.error ?? 'unknown';
      logTransition('TTS', `error ${error}`);
      if (error === 'interrupted' || error === 'canceled') {
        if (generation !== speakGeneration) {
          finish(error);
          return;
        }
      }
      finish('error');
    };

    const begin = () => {
      if (settled || generation !== speakGeneration) return;
      try {
        if (synth.paused) synth.resume();
        synth.speak(utterance);
        if (synth.paused) synth.resume();
      } catch (error) {
        logTransition('TTS', 'speak threw', error);
        finish('throw');
      }
    };

    const voicesReady = synth.getVoices().length > 0;
    const delayMs = synth.speaking || synth.pending ? 120 : 60;
    if (!voicesReady) {
      synth.addEventListener('voiceschanged', begin, { once: true });
      window.setTimeout(begin, 200);
    } else {
      window.setTimeout(begin, delayMs);
    }
  });
}

export function stopSpeaking() {
  speakGeneration += 1;
  stopResumePulse();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function startResumePulse() {
  stopResumePulse();
  if (typeof window === 'undefined') return;
  resumeTimer = window.setInterval(() => {
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch {
      // ignore
    }
  }, 250);
}

function stopResumePulse() {
  if (resumeTimer) {
    window.clearInterval(resumeTimer);
    resumeTimer = null;
  }
}

function fallbackLang(lang: string) {
  const prefix = lang.slice(0, 2).toLowerCase();
  if (prefix === 'sn' || prefix === 'nd') return 'en-US';
  return lang;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const exact = voices.find((voice) => voice.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  const prefix = lang.slice(0, 2).toLowerCase();
  if (prefix === 'sn' || prefix === 'nd') {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));
  }
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
  );
}

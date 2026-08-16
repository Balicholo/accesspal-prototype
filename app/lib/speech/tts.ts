import { logTransition } from '../controller/logger';
import { getLanguage } from '../i18n/languages';
import type { LanguageCode } from '../types';

let speakGeneration = 0;
let resumeTimer: number | null = null;

export function isMobileVoiceClient() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

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
    const mobile = isMobileVoiceClient();
    const utterance = new SpeechSynthesisUtterance(text);
    const config = getLanguage(language);
    const requested = config.speechSynthesisCode ?? 'en-US';
    const voice = pickVoice(requested);

    utterance.lang = voice?.lang ?? fallbackLang(requested);
    if (voice) utterance.voice = voice;
    utterance.rate = hooks.rate ?? (mobile ? 0.92 : 0.96);
    utterance.pitch = 1;
    utterance.volume = 1;

    let settled = false;
    let started = false;
    const estimatedMs = Math.min(22000, Math.max(2800, 700 + text.length * 75));

    const finish = (reason: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(watchdog);
      window.clearTimeout(startGuard);
      stopResumePulse();
      logTransition('TTS', `ended (${reason})`);
      hooks.onEnd?.();
      resolve();
    };

    const watchdog = window.setTimeout(() => finish('watchdog'), estimatedMs + (mobile ? 6000 : 4000));

    utterance.onstart = () => {
      if (generation !== speakGeneration) return;
      started = true;
      logTransition('TTS', 'started');
      startResumePulse();
      hooks.onStart?.();
    };
    utterance.onend = () => finish('onend');
    utterance.onerror = (event) => {
      const error = event.error ?? 'unknown';
      logTransition('TTS', `error ${error}`);
      finish(error === 'interrupted' || error === 'canceled' ? error : 'error');
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

    const startGuard = window.setTimeout(() => {
      if (settled || started || generation !== speakGeneration) return;
      logTransition('TTS', 'onstart missing, retrying');
      try {
        synth.resume();
        if (!synth.speaking && !synth.pending) {
          synth.speak(utterance);
        }
      } catch {
        finish('retry-failed');
      }
    }, mobile ? 900 : 700);

    let kicked = false;
    const kickOff = () => {
      if (kicked || settled || generation !== speakGeneration) return;
      kicked = true;
      startResumePulse();
      begin();
    };

    const afterCancel = mobile ? 320 : 140;
    if (synth.speaking || synth.pending) {
      synth.cancel();
      window.setTimeout(kickOff, afterCancel);
    } else if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', kickOff, { once: true });
      window.setTimeout(kickOff, 280);
    } else {
      window.setTimeout(kickOff, mobile ? 80 : 40);
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
  }, 200);
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
    return (
      voices.find((voice) => /en-GB|en-ZA|en-US/i.test(voice.lang) && /google|samsung|android/i.test(voice.name)) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
    );
  }
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix) && /google|samsung|android/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
  );
}

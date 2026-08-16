import { logTransition } from '../controller/logger';
import { VOICE_CONFIG } from '../assistant/config';
import { inspectWake } from './wakeWord';
import type { LanguageCode } from '../types';

export type VoiceMode = 'off' | 'wake' | 'command';

export interface SpeechResult {
  transcript: string;
  final: boolean;
  confidence: number;
}

export interface SpeechProvider {
  readonly name: string;
  start(mode: Exclude<VoiceMode, 'off'>, language?: LanguageCode, options?: { silenceMs?: number }): boolean;
  restartFresh?(mode: Exclude<VoiceMode, 'off'>, language?: LanguageCode, options?: { silenceMs?: number }): boolean;
  mute(): void;
  unmute(): void;
  pause(): void;
  stop(): void;
  setLanguage(language: LanguageCode): void;
  isActive(): boolean;
  getMode(): VoiceMode;
}

type Handlers = {
  onFinal: (result: SpeechResult) => void;
  onInterim?: (transcript: string) => void;
  onStart?: (mode: Exclude<VoiceMode, 'off'>) => void;
  onEnd?: () => void;
  onTimeout?: () => void;
  onError?: (message: string) => void;
  onPermission?: (granted: boolean) => void;
};

/**
 * Single-instance browser STT with an explicit session lifecycle.
 * Final transcripts stop recognition. The controller decides whether to restart.
 */
export class BrowserSpeechProvider implements SpeechProvider {
  readonly name = 'browser-webkit';
  private recognition: SpeechRecognitionLike | null = null;
  private mode: VoiceMode = 'off';
  private language: LanguageCode = 'en';
  private sessionId = 0;
  private starting = false;
  private stopping = false;
  private muted = false;
  private shouldRestart = false;
  private silenceTimer: number | null = null;
  private commandSilence = 6500;
  private lastFinal = '';
  private lastFinalAt = 0;
  private utterance = '';
  private pendingPreview = '';
  private endSpeechTimer: number | null = null;
  private handlers: Handlers;

  constructor(handlers: Handlers) {
    this.handlers = handlers;
  }

  isActive() {
    return this.mode !== 'off' && !this.muted && Boolean(this.recognition);
  }

  getMode(): VoiceMode {
    return this.mode;
  }

  setLanguage(language: LanguageCode) {
    this.language = language;
  }

  async requestMicrophone(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.handlers.onPermission?.(false);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      this.handlers.onPermission?.(true);
      return true;
    } catch (error) {
      logTransition('VOICE', 'microphone permission failed', error);
      this.handlers.onPermission?.(false);
      return false;
    }
  }

  start(
    mode: Exclude<VoiceMode, 'off'>,
    language: LanguageCode = this.language,
    options?: { silenceMs?: number }
  ) {
    if (typeof window === 'undefined') return false;
    if (!getSpeechRecognition()) {
      this.handlers.onError?.(
        "I don't have access to speech recognition. You can type your request instead."
      );
      return false;
    }

    this.language = language;
    this.commandSilence = options?.silenceMs ?? (mode === 'command' ? VOICE_CONFIG.noCommandMs : 20000);
    this.muted = false;
    this.shouldRestart = true;
    this.mode = mode;
    this.utterance = '';
    this.pendingPreview = '';

    if (this.recognition && this.starting) return true;
    if (this.recognition && !this.stopping) {
      if (mode === 'command') this.armSilence(this.commandSilence);
      this.handlers.onStart?.(mode);
      return true;
    }

    return this.begin();
  }

  restartFresh(
    mode: Exclude<VoiceMode, 'off'>,
    language: LanguageCode = this.language,
    options?: { silenceMs?: number }
  ) {
    this.shouldRestart = true;
    this.mode = mode;
    this.muted = false;
    this.language = language;
    this.commandSilence = options?.silenceMs ?? (mode === 'command' ? VOICE_CONFIG.noCommandMs : 20000);
    this.utterance = '';
    this.pendingPreview = '';
    this.tearDown();
    this.stopping = false;
    return this.begin();
  }

  mute() {
    this.muted = true;
    this.clearSilence();
  }

  unmute() {
    this.muted = false;
    if (this.mode === 'command') this.armSilence(this.commandSilence);
  }

  pause() {
    this.shouldRestart = false;
    this.mute();
  }

  stop() {
    this.shouldRestart = false;
    this.mode = 'off';
    this.muted = true;
    this.lastFinal = '';
    this.lastFinalAt = 0;
    this.utterance = '';
    this.clearSilence();
    this.clearEndSpeech();
    this.tearDown();
  }

  private begin() {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return false;

    this.tearDown();
    this.starting = true;
    this.stopping = false;
    this.sessionId += 1;
    const sessionId = this.sessionId;

    const recognition = new SpeechRecognition();
    this.recognition = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      if (sessionId !== this.sessionId) return;
      this.starting = false;
      logTransition('VOICE', `started (${this.mode})`);
      if (this.mode !== 'off' && !this.muted) {
        this.handlers.onStart?.(this.mode);
      }
      if (this.mode === 'command' && !this.muted) this.armSilence(this.commandSilence);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (sessionId !== this.sessionId) return;
      if (this.muted || this.mode === 'off') return;

      let interim = '';
      let finalText = '';
      let confidence = 1;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result[0];
        const transcript = (piece?.transcript ?? '').trim();
        if (!transcript || !piece) continue;
        const score = typeof piece.confidence === 'number' ? piece.confidence : 1;
        if (result.isFinal) {
          finalText = `${finalText} ${transcript}`.trim();
          confidence = score > 0 ? score : 0.85;
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      if (finalText) {
        this.utterance = `${this.utterance} ${finalText}`.trim();
      }
      const preview = `${this.utterance} ${interim}`.trim();
      this.pendingPreview = preview;
      if (preview) this.handlers.onInterim?.(preview);

      if (this.mode === 'wake') {
        const wake = inspectWake(preview);
        if (!wake.addressed) return;
        this.armEndSpeech(
          wake.command ? VOICE_CONFIG.endOfSpeechMs : VOICE_CONFIG.wakeOnlyCommitMs,
          confidence
        );
        return;
      }

      this.armSilence(this.commandSilence);
      this.armEndSpeech(VOICE_CONFIG.endOfSpeechMs, confidence);
    };

    recognition.onerror = (event: { error?: string }) => {
      if (sessionId !== this.sessionId) return;
      this.starting = false;
      const error = event.error ?? 'unknown';
      logTransition('VOICE', `error ${error}`);
      if (error === 'not-allowed') {
        this.shouldRestart = false;
        this.mode = 'off';
        this.handlers.onError?.(
          "I don't have access to your microphone. You can enable it in your browser settings, or type your request instead."
        );
        return;
      }
      if (error === 'aborted' || error === 'no-speech') return;
      if (error === 'network') {
        this.handlers.onError?.("I'm having trouble hearing you. Please try again, or type your request.");
      }
    };

    recognition.onend = () => {
      if (sessionId !== this.sessionId) return;
      this.starting = false;
      this.recognition = null;
      this.handlers.onEnd?.();
      if (this.mode === 'off' || this.stopping || !this.shouldRestart) return;
      window.setTimeout(() => {
        if (this.shouldRestart && this.mode !== 'off' && sessionId === this.sessionId) {
          this.ensureRunning();
        }
      }, 180);
    };

    try {
      recognition.start();
      return true;
    } catch (error) {
      this.starting = false;
      logTransition('VOICE', 'start threw', error);
      window.setTimeout(() => this.ensureRunning(), 320);
      return true;
    }
  }

  private emitFinal(transcript: string, confidence: number) {
    const cleaned = (transcript || this.pendingPreview || this.utterance).trim();
    if (!cleaned) return;
    const now = Date.now();
    if (
      this.lastFinal &&
      now - this.lastFinalAt < 1400 &&
      (cleaned === this.lastFinal ||
        cleaned.includes(this.lastFinal) ||
        this.lastFinal.includes(cleaned))
    ) {
      return;
    }
    this.lastFinal = cleaned;
    this.lastFinalAt = now;
    this.utterance = '';
    this.clearSilence();
    this.clearEndSpeech();
    this.muted = true;
    this.shouldRestart = false;
    logTransition('VOICE', `final transcript received: "${cleaned}"`);
    this.handlers.onFinal({
      transcript: cleaned,
      final: true,
      confidence: confidence > 0 ? confidence : 0.85,
    });
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
  }

  private armEndSpeech(ms: number, confidence: number) {
    this.clearEndSpeech();
    this.endSpeechTimer = window.setTimeout(() => {
      if (this.muted) return;
      this.emitFinal(this.pendingPreview || this.utterance, confidence);
    }, ms);
  }

  private clearEndSpeech() {
    if (this.endSpeechTimer) {
      window.clearTimeout(this.endSpeechTimer);
      this.endSpeechTimer = null;
    }
  }

  private ensureRunning() {
    if (this.mode === 'off' || this.stopping || !this.shouldRestart) return;
    if (this.recognition || this.starting) return;
    this.begin();
  }

  private tearDown() {
    this.stopping = true;
    this.clearSilence();
    this.clearEndSpeech();
    this.utterance = '';
    if (this.recognition) {
      const recognition = this.recognition;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onstart = null;
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      }
    }
    this.recognition = null;
    this.starting = false;
    window.setTimeout(() => {
      this.stopping = false;
    }, 120);
  }

  private armSilence(ms: number) {
    this.clearSilence();
    this.silenceTimer = window.setTimeout(() => {
      if (this.muted) return;
      if (this.utterance.trim()) {
        this.emitFinal(this.pendingPreview || this.utterance, 0.8);
        return;
      }
      this.handlers.onTimeout?.();
    }, ms);
  }

  private clearSilence() {
    if (this.silenceTimer) {
      window.clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0?: { transcript?: string; confidence?: number };
  }>;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
      .webkitSpeechRecognition ||
    null
  );
}

export function isSpeechRecognitionSupported() {
  return Boolean(typeof window !== 'undefined' && getSpeechRecognition());
}

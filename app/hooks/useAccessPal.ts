'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhone } from '../context/PhoneProvider';
import {
  ConversationEngine,
  autoAdvanceUtterance,
  type EngineTurnResult,
} from '../lib/ai/conversationEngine';
import { playActivationChime } from '../lib/assistant/audio';
import { VOICE_CONFIG } from '../lib/assistant/config';
import { logTransition } from '../lib/controller/logger';
import { ActionEngine } from '../lib/engine/actionEngine';
import { delay } from '../lib/services/wallet';
import { speak, stopSpeaking, isMobileVoiceClient } from '../lib/speech/tts';
import {
  BrowserSpeechProvider,
  isSpeechRecognitionSupported,
} from '../lib/voice/stt';
import { inspectWake, isWakeOnly } from '../lib/voice/wakeWord';
import { extractFeatures } from '../lib/ai/features';
import { normalizeText } from '../lib/format';
import { isCancelMeaning, isConfirmMeaning } from '../lib/tasks/dialogueActs';
import type { AssistantPhase, EngineTurn, VoiceState } from '../lib/phone/types';
import type { PlayableDemo } from '../data/demoScenarios';

const FOLLOW_UP_MS = 8000;
const TASK_FOLLOW_UP_MS = 20000;
const PROCESS_TIMEOUT_MS = 8000;

type IngestSource = 'voice' | 'text' | 'demo';

export function useAccessPal() {
  const phone = usePhone();
  const engineRef = useRef(new ConversationEngine());
  const actionEngineRef = useRef(new ActionEngine(phone.dispatch));
  const listenerRef = useRef<BrowserSpeechProvider | null>(null);
  const turnIdRef = useRef(0);
  const cancelledRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const followUpRef = useRef(false);
  const handsFreeRef = useRef(false);
  const demoRef = useRef(false);
  const lastSpokenRef = useRef('');
  const lastSpokenAtRef = useRef(0);
  const lastWakeRef = useRef(0);
  const lastUtteranceRef = useRef('');
  const voiceRateRef = useRef(0.96);
  const sleepTimerRef = useRef<number | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [micSupported] = useState(() =>
    typeof window === 'undefined' ? true : isSpeechRecognitionSupported()
  );
  const [handsFree, setHandsFree] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [micError, setMicError] = useState('');

  const patchSession = useCallback(
    (patch: {
      voiceState?: VoiceState;
      phase?: AssistantPhase;
      reply?: string;
      heard?: string;
      isListening?: boolean;
      isProcessing?: boolean;
      isSpeaking?: boolean;
      currentAction?: string;
      actionState?: string;
      activeDemo?: string | null;
      debugIntent?: string;
    }) => {
      phone.dispatch({ type: 'SET_SESSION', ...patch });
    },
    [phone.dispatch]
  );

  const clearSleep = useCallback(() => {
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  const stopMic = useCallback(() => {
    listenerRef.current?.stop();
    patchSession({ isListening: false });
  }, [patchSession]);

  const pauseMic = useCallback(() => {
    if (isMobileVoiceClient()) {
      listenerRef.current?.holdSession();
    } else {
      listenerRef.current?.stop();
    }
    patchSession({ isListening: false });
  }, [patchSession]);

  const startMic = useCallback(
    (mode: 'wake' | 'command', silenceMs?: number) => {
      const listener = listenerRef.current;
      if (!listener || !handsFreeRef.current || demoRef.current) return;
      const language = engineRef.current.getContext().language;
      const started = isMobileVoiceClient()
        ? listener.resumeSession(mode, language, { silenceMs })
        : listener.start(mode, language, { silenceMs });
      if (started) {
        patchSession({
          voiceState: mode === 'command' ? 'listening' : 'idle',
          phase: mode === 'command' ? 'listening' : 'standby',
          isListening: true,
        });
      }
    },
    [patchSession]
  );

  const enterIdle = useCallback(() => {
    followUpRef.current = false;
    clearSleep();
    patchSession({
      voiceState: 'idle',
      phase: handsFreeRef.current ? 'standby' : 'dormant',
      isListening: Boolean(handsFreeRef.current),
      isProcessing: false,
      isSpeaking: false,
      currentAction: '',
      actionState: 'idle',
    });
    if (handsFreeRef.current && !demoRef.current) {
      startMic('wake');
    }
  }, [clearSleep, patchSession, startMic]);

  const armFollowUp = useCallback(
    (ms: number) => {
      followUpRef.current = true;
      clearSleep();
      sleepTimerRef.current = window.setTimeout(() => {
        if (processingRef.current || speakingRef.current || demoRef.current) return;
        logTransition('VOICE', 'follow-up timed out');
        enterIdle();
      }, ms);
      patchSession({
        voiceState: 'waiting_for_follow_up',
        phase: 'listening',
        isListening: Boolean(handsFreeRef.current),
        isProcessing: false,
        isSpeaking: false,
      });
      startMic('command', ms);
    },
    [clearSleep, enterIdle, patchSession, startMic]
  );

  const recover = useCallback(
    (message: string) => {
      logTransition('VOICE', `recovery: ${message}`);
      processingRef.current = false;
      speakingRef.current = false;
      followUpRef.current = false;
      stopSpeaking();
      phone.dispatch({ type: 'SET_ERROR', message });
      patchSession({
        voiceState: 'error',
        phase: 'dormant',
        isListening: false,
        isProcessing: false,
        isSpeaking: false,
        reply: message,
      });
      window.setTimeout(() => {
        phone.dispatch({ type: 'CLEAR_ERROR' });
        enterIdle();
      }, 1600);
    },
    [enterIdle, patchSession, phone]
  );

  const speakLine = useCallback(
    async (
      line: string,
      language: EngineTurn['language'],
      turnId: number,
      compact = false
    ) => {
      speakingRef.current = true;
      lastSpokenRef.current = line;
      lastSpokenAtRef.current = Date.now();
      pauseMic();
      patchSession({
        voiceState: 'speaking',
        phase: compact ? 'executing' : 'speaking',
        isSpeaking: true,
        isListening: false,
        reply: line,
      });
      await speak(line, language, {
        rate: voiceRateRef.current,
      });
      const tail = isMobileVoiceClient() ? 650 : 280;
      await delay(tail);
      lastSpokenAtRef.current = Date.now();
      speakingRef.current = false;
      if (turnId !== turnIdRef.current) return;
      patchSession({ isSpeaking: false });
    },
    [patchSession, pauseMic]
  );

  const runTurn = useCallback(
    async (result: EngineTurnResult, turnId: number) => {
      if (turnId !== turnIdRef.current || cancelledRef.current) return;

      patchSession({
        debugIntent: result.intent ?? result.task?.type ?? '',
        reply: result.reply,
      });

      const hasActions = result.actions.length > 0;
      if (hasActions) {
        patchSession({
          voiceState: 'executing_action',
          phase: 'executing',
          isProcessing: false,
        });
      }

      const speakFirst = speakLine(result.reply, result.language, turnId, hasActions);

      if (hasActions) {
        await delay(160);
        if (turnId !== turnIdRef.current || cancelledRef.current) {
          await speakFirst;
          return;
        }
        logTransition('ACTION', `${result.intent ?? 'action'} started`);
        await actionEngineRef.current.run(result.actions, {
          cancelled: () => cancelledRef.current || turnId !== turnIdRef.current,
          onStatus: (label, actionState) => {
            patchSession({
              currentAction: label,
              actionState,
              phase: 'executing',
              voiceState: 'executing_action',
            });
          },
        });
      }

      await speakFirst;
      if (result.followUpReply && turnId === turnIdRef.current && !cancelledRef.current) {
        await speakLine(result.followUpReply, result.language, turnId, true);
      }
    },
    [patchSession, speakLine]
  );

  const ingest = useCallback(
    async (
      text: string,
      options: { source: IngestSource; confidence?: number; requireWake?: boolean }
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (processingRef.current && options.source === 'voice') {
        return;
      }

      if (options.source === 'voice') {
        if (isSelfEcho(trimmed, lastSpokenRef.current, lastSpokenAtRef.current)) {
          return;
        }
        if (speakingRef.current) {
          const act = extractFeatures(trimmed).act;
          const wake = inspectWake(trimmed);
          if (act === 'cancel' || wake.addressed) {
            stopSpeaking();
            speakingRef.current = false;
            if (act === 'cancel' && !wake.command) {
              enterIdle();
              return;
            }
          } else {
            return;
          }
        }
      }

      const wake = inspectWake(trimmed);
      if (
        wake.addressed &&
        Date.now() - lastWakeRef.current < VOICE_CONFIG.wakeDebounceMs &&
        isWakeOnly(trimmed)
      ) {
        return;
      }

      const listeningMode = listenerRef.current?.getMode();
      const sessionOpen = followUpRef.current || listeningMode === 'command';
      const requireWake =
        options.requireWake ??
        (options.source === 'voice' && !sessionOpen && listeningMode === 'wake' && !demoRef.current);

      if (requireWake && !wake.addressed) {
        return;
      }

      if (wake.addressed) lastWakeRef.current = Date.now();

      if ((sessionOpen || listeningMode === 'wake') && isWakeOnly(trimmed)) {
        followUpRef.current = true;
        playActivationChime();
        patchSession({
          voiceState: 'wake_detected',
          phase: 'waking',
          heard: trimmed,
          isListening: true,
        });
        const ack = engineRef.current.process(trimmed) as EngineTurnResult;
        if (isMobileVoiceClient()) {
          patchSession({
            reply: ack.reply,
            phase: 'listening',
            voiceState: 'waiting_for_follow_up',
            isSpeaking: false,
            isListening: true,
          });
        } else {
          await speakLine(ack.reply, ack.language, turnIdRef.current);
        }
        armFollowUp(VOICE_CONFIG.noCommandMs);
        return;
      }

      lastUtteranceRef.current = trimmed;
      cancelledRef.current = false;
      processingRef.current = true;
      turnIdRef.current += 1;
      const turnId = turnIdRef.current;
      clearSleep();
      pauseMic();
      stopSpeaking();
      phone.dispatch({ type: 'CLEAR_ERROR' });

      const phase: AssistantPhase = isWakeOnly(trimmed) ? 'waking' : 'thinking';
      patchSession({
        voiceState: isWakeOnly(trimmed) ? 'wake_detected' : 'processing',
        phase,
        heard: trimmed,
        isListening: false,
        isProcessing: true,
        isSpeaking: false,
        debugIntent: '',
      });
      logTransition('AI', `request started: "${trimmed}"`);

      try {
        const result = await withTimeout(
          (async () => {
            const turn = engineRef.current.process(trimmed, {
              confidence: options.confidence,
            }) as EngineTurnResult;
            if (turn.asyncReply) {
              turn.reply = await turn.asyncReply();
            }
            return turn;
          })(),
          PROCESS_TIMEOUT_MS
        );
        logTransition('AI', `response received (${result.intent ?? 'unknown'})`);
        processingRef.current = false;
        patchSession({ isProcessing: false });

        await runTurn(result, turnId);

        if (turnId !== turnIdRef.current || cancelledRef.current) return;

        if (options.source === 'demo') {
          let current = result;
          while (true) {
            const next = autoAdvanceUtterance(engineRef.current.getContext().task);
            if (!next) break;
            await delay(current.task?.step === 'permission' ? 900 : 450);
            if (turnId !== turnIdRef.current || cancelledRef.current) return;
            logTransition('DEMO', `auto-advance "${next}"`);
            current = engineRef.current.process(next) as EngineTurnResult;
            await runTurn(current, turnId);
          }
          followUpRef.current = Boolean(engineRef.current.getContext().task || current.expectFollowUp);
          processingRef.current = false;
          return;
        }

        const expectFollowUp = Boolean(result.expectFollowUp || result.task);
        followUpRef.current = expectFollowUp;
        if (expectFollowUp) {
          armFollowUp(result.task ? TASK_FOLLOW_UP_MS : FOLLOW_UP_MS);
        } else {
          await delay(500);
          if (turnId === turnIdRef.current) enterIdle();
        }
      } catch (error) {
        logTransition('AI', 'request failed', error);
        processingRef.current = false;
        recover("I'm having trouble processing that. Please try again.");
      }
    },
    [armFollowUp, clearSleep, enterIdle, pauseMic, patchSession, phone, recover, runTurn, speakLine, startMic]
  );

  const ingestRef = useRef(ingest);
  ingestRef.current = ingest;
  const enterIdleRef = useRef(enterIdle);
  enterIdleRef.current = enterIdle;
  const patchSessionRef = useRef(patchSession);
  patchSessionRef.current = patchSession;
  const recoverRef = useRef(recover);
  recoverRef.current = recover;

  useEffect(() => {
    actionEngineRef.current = new ActionEngine(phone.dispatch);
  }, [phone.dispatch]);

  useEffect(() => {
    const listener = new BrowserSpeechProvider({
      onStart: (mode) => {
        if (processingRef.current) return;
        if (speakingRef.current && mode === 'command') return;
        patchSessionRef.current({
          voiceState: mode === 'command' ? 'listening' : 'idle',
          phase: mode === 'command' ? 'listening' : 'standby',
          isListening: true,
        });
      },
      onFinal: (result) => {
        if (!result.transcript.trim()) return;
        if (processingRef.current || speakingRef.current) return;
        if (isSelfEcho(result.transcript, lastSpokenRef.current, lastSpokenAtRef.current)) return;
        const needsWake =
          listenerRef.current?.getMode() === 'wake' && !followUpRef.current && !speakingRef.current;
        void ingestRef.current(result.transcript, {
          source: 'voice',
          confidence: result.confidence,
          requireWake: needsWake,
        });
      },
      onInterim: (transcript) => {
        if (processingRef.current || speakingRef.current) return;
        if (listenerRef.current?.getMode() !== 'command' && !followUpRef.current) {
          patchSessionRef.current({
            phase: 'listening',
            voiceState: 'listening',
            isListening: true,
          });
          return;
        }
        patchSessionRef.current({
          phase: 'listening',
          voiceState: 'listening',
          heard: transcript,
          isListening: true,
        });
      },
      onTimeout: () => {
        if (processingRef.current || speakingRef.current) return;
        if (followUpRef.current) {
          followUpRef.current = false;
          listenerRef.current?.stop();
          void speak("Sorry, I didn't catch that.", engineRef.current.getContext().language).then(
            () => enterIdleRef.current()
          );
          return;
        }
        enterIdleRef.current();
      },
      onPermission: (granted) => setMicReady(granted),
      onError: (message) => {
        setFallbackOpen(true);
        setMicError(message);
        setHandsFree(false);
        handsFreeRef.current = false;
        recoverRef.current(message);
      },
    });
    listenerRef.current = listener;
    return () => {
      listener.stop();
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const enableHandsFree = useCallback(async () => {
    const listener = listenerRef.current;
    if (!listener) return false;
    stopSpeaking();
    processingRef.current = false;
    speakingRef.current = false;
    followUpRef.current = false;
    lastSpokenRef.current = '';

    const granted = await listener.requestMicrophone();
    setMicReady(granted);
    if (!granted) {
      const message =
        'Microphone access is required for voice interaction. You can also type your request.';
      setFallbackOpen(true);
      setMicError(message);
      return false;
    }
    setHandsFree(true);
    handsFreeRef.current = true;
    patchSession({
      voiceState: 'idle',
      phase: 'standby',
      isListening: true,
      isProcessing: false,
      isSpeaking: false,
      heard: '',
      reply: '',
    });
    const started = listener.restartFresh('wake', engineRef.current.getContext().language);
    if (!started) {
      setHandsFree(false);
      handsFreeRef.current = false;
      setFallbackOpen(true);
      return false;
    }
    return true;
  }, [patchSession]);

  useEffect(() => {
    engineRef.current.setLanguage(phone.state.language);
    listenerRef.current?.setLanguage(phone.state.language);
  }, [phone.state.language]);

  useEffect(() => {
    voiceRateRef.current = phone.state.voiceRate;
  }, [phone.state.voiceRate]);

  const retryLast = useCallback(async () => {
    phone.dispatch({ type: 'CLEAR_ERROR' });
    const last = lastUtteranceRef.current;
    if (!last) return;
    processingRef.current = false;
    await ingest(last, { source: 'text', requireWake: false });
  }, [ingest, phone]);

  const submitText = useCallback(
    async (text: string) => {
      followUpRef.current = true;
      await ingest(text, { source: 'text', requireWake: false });
    },
    [ingest]
  );

  const abortAll = useCallback(() => {
    cancelledRef.current = true;
    turnIdRef.current += 1;
    processingRef.current = false;
    speakingRef.current = false;
    demoRef.current = false;
    stopSpeaking();
    stopMic();
    engineRef.current.reset();
    phone.dispatch({ type: 'CLEAR_PERMISSION' });
    phone.dispatch({ type: 'CLEAR_ERROR' });
    followUpRef.current = false;
    clearSleep();
    patchSession({
      voiceState: 'idle',
      phase: handsFreeRef.current ? 'standby' : 'dormant',
      isListening: Boolean(handsFreeRef.current),
      isProcessing: false,
      isSpeaking: false,
      currentAction: '',
      actionState: 'idle',
      activeDemo: null,
    });
    if (handsFreeRef.current) {
      startMic('wake');
    }
  }, [clearSleep, patchSession, phone, startMic, stopMic]);

  const playDemo = useCallback(
    async (scenario: PlayableDemo) => {
      abortAll();
      cancelledRef.current = false;
      demoRef.current = true;
      setDemoRunning(true);
      engineRef.current.reset();
      phone.dispatch({ type: 'RESET_DEVICE' });
      patchSession({ activeDemo: scenario.id, phase: 'dormant' });
      logTransition('DEMO', `started ${scenario.id}`);
      await delay(280);

      try {
        for (const turn of scenario.turns) {
          if (cancelledRef.current) break;
          if (shouldSkipFiller(turn, engineRef.current.getContext().task)) continue;
          followUpRef.current = true;
          await ingest(turn, { source: 'demo', requireWake: false });
          await delay(350);
        }
      } catch (error) {
        logTransition('DEMO', 'failed', error);
        recover("I couldn't complete that action. Would you like me to try again?");
      } finally {
        demoRef.current = false;
        setDemoRunning(false);
        patchSession({ activeDemo: null });
        logTransition('DEMO', 'finished');
        await delay(2800);
        if (!cancelledRef.current) {
          phone.dispatch({ type: 'GO_HOME' });
          enterIdle();
        }
      }
    },
    [abortAll, enterIdle, ingest, patchSession, phone, recover]
  );

  const resetDevice = useCallback(() => {
    abortAll();
    engineRef.current.reset();
    phone.dispatch({ type: 'RESET_DEVICE' });
    demoRef.current = false;
    setDemoRunning(false);
    enterIdle();
  }, [abortAll, enterIdle, phone]);

  return {
    micReady,
    micSupported,
    handsFree,
    demoRunning,
    fallbackOpen,
    micError,
    setFallbackOpen,
    enableHandsFree,
    submitText,
    retryLast,
    playDemo,
    resetDevice,
    abortAll,
    handleUtterance: (text: string) => ingest(text, { source: 'text', requireWake: false }),
  };
}

function shouldSkipFiller(text: string, task: EngineTurn['task']) {
  if (task) return false;
  const act = extractFeatures(text).act;
  return act === 'confirm' || act === 'allow';
}

function isSelfEcho(transcript: string, lastSpoken: string, spokenAt = 0) {
  const heard = normalizeText(transcript);
  if (!heard) return true;
  if (
    /^(yes i m listening|yes im listening|yes i am listening|i m listening|im listening|i m still listening|im still listening|listening|hongu ndiri kunzwa|yebo ngiyalalela|ndiyo ninasikiliza)$/.test(
      heard
    )
  ) {
    return true;
  }
  const spoken = normalizeText(lastSpoken);
  if (!spoken) return false;
  if (heard === spoken) return true;
  if (isConfirmMeaning(heard) || isCancelMeaning(heard)) return false;

  const overlap = tokenOverlap(heard, spoken);
  if (overlap >= 0.45) return true;
  if (spoken.includes(heard) && heard.length >= 8) return true;
  if (heard.includes(spoken) && spoken.length >= 8) return true;

  const recent = Date.now() - spokenAt < 1400;
  if (recent) {
    if (/\bbalance\b/.test(heard) && /\bbalance\b/.test(spoken)) return true;
    if (/\becocash\b/.test(heard) && /\becocash\b/.test(spoken)) return true;
    if (overlap >= 0.28) return true;
  }
  return false;
}

function tokenOverlap(a: string, b: string) {
  const left = new Set(a.split(' ').filter((token) => token.length > 2));
  const right = b.split(' ').filter((token) => token.length > 2);
  if (!left.size || !right.length) return 0;
  let hits = 0;
  for (const token of right) {
    if (left.has(token)) hits += 1;
  }
  return hits / Math.min(left.size, right.length);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('processing timeout')), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

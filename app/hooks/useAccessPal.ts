'use client';

/**
 * Single AccessPal session controller.
 * Voice: OpenAI Realtime (primary) or browser STT (fallback only).
 * Text: /api/chat → planToolCall → ActionEngine, or local ConversationEngine if OpenAI is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhone } from '../context/PhoneProvider';
import {
  ConversationEngine,
  type EngineTurnResult,
} from '../lib/ai/conversationEngine';
import { playActivationChime } from '../lib/assistant/audio';
import { VOICE_CONFIG } from '../lib/assistant/config';
import { logTransition } from '../lib/controller/logger';
import { ActionEngine } from '../lib/engine/actionEngine';
import { planToolCall } from '../lib/engine/phoneTools';
import { delay } from '../lib/services/wallet';
import { speak, stopSpeaking, isMobileVoiceClient } from '../lib/speech/tts';
import {
  BrowserSpeechProvider,
  isSpeechRecognitionSupported,
} from '../lib/voice/stt';
import { inspectWake, isWakeOnly, stripWakeWord } from '../lib/voice/wakeWord';
import { extractFeatures } from '../lib/ai/features';
import { detectSpokenLanguage } from '../lib/ai/languageDetector';
import { openAISession } from '../lib/ai/openai/session';
import { RealtimeVoiceClient, isRealtimeSupported } from '../lib/voice/realtimeClient';
import { normalizeText } from '../lib/format';
import { isCancelMeaning, isConfirmMeaning } from '../lib/tasks/dialogueActs';
import type { AssistantPhase, EngineTurn, VoiceState } from '../lib/phone/types';

const FOLLOW_UP_MS = 8000;
const TASK_FOLLOW_UP_MS = 20000;
const PROCESS_TIMEOUT_MS = 8000;
const OPENAI_TIMEOUT_MS = 50000;

type IngestSource = 'voice' | 'text';

export function useAccessPal() {
  const phone = usePhone();
  const engineRef = useRef(new ConversationEngine());
  const actionEngineRef = useRef(new ActionEngine(phone.dispatch));
  const listenerRef = useRef<BrowserSpeechProvider | null>(null);
  const realtimeRef = useRef<RealtimeVoiceClient | null>(null);
  const voicePathRef = useRef<'realtime' | 'browser' | 'none'>('none');
  const languageRef = useRef(phone.state.language);
  const turnIdRef = useRef(0);
  const cancelledRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const followUpRef = useRef(false);
  const handsFreeRef = useRef(false);
  const lastSpokenRef = useRef('');
  const lastSpokenAtRef = useRef(0);
  const lastWakeRef = useRef(0);
  const lastUtteranceRef = useRef('');
  const voiceRateRef = useRef(0.96);
  const sleepTimerRef = useRef<number | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [micSupported] = useState(() =>
    typeof window === 'undefined'
      ? true
      : Boolean(navigator.mediaDevices?.getUserMedia) || isSpeechRecognitionSupported()
  );
  const [handsFree, setHandsFree] = useState(false);
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
      debugEngine?: 'openai' | 'local' | 'realtime' | '';
      debugToolArgs?: string;
      debugRealtime?: string;
      debugLastEvent?: string;
    }) => {
      phone.dispatch({ type: 'SET_SESSION', ...patch });
    },
    [phone]
  );

  const executePhoneActions = useCallback(
    async (actions: import('../lib/phone/types').PhoneAction[], toolName: string) => {
      patchSession({
        debugIntent: toolName,
        debugEngine: voicePathRef.current === 'realtime' ? 'realtime' : 'openai',
        voiceState: 'executing_action',
        phase: 'executing',
        isProcessing: false,
      });
      logTransition('ACTION', `${toolName} started`);
      return actionEngineRef.current.run(actions, {
        cancelled: () => cancelledRef.current,
        onStatus: (label, actionState) => {
          patchSession({
            currentAction: label,
            actionState,
            phase: 'executing',
            voiceState: 'executing_action',
          });
        },
      });
    },
    [patchSession]
  );
  const executePhoneActionsRef = useRef(executePhoneActions);
  executePhoneActionsRef.current = executePhoneActions;

  const applyRealtimeUi = useCallback(
    (state: import('../lib/voice/realtimeClient').RealtimeUiState) => {
      if (state === 'connecting') {
        patchSession({
          voiceState: 'connecting',
          phase: 'thinking',
          isListening: false,
          isProcessing: true,
          isSpeaking: false,
          currentAction: 'Connecting voice...',
          debugRealtime: 'connecting',
          debugEngine: 'realtime',
        });
        return;
      }
      if (state === 'user_speaking') {
        patchSession({
          voiceState: 'user_speaking',
          phase: 'listening',
          isListening: true,
          isProcessing: false,
          isSpeaking: false,
          debugRealtime: 'connected',
        });
        return;
      }
      if (state === 'processing') {
        patchSession({
          voiceState: 'processing',
          phase: 'thinking',
          isListening: false,
          isProcessing: true,
          isSpeaking: false,
        });
        return;
      }
      if (state === 'assistant_speaking') {
        speakingRef.current = true;
        patchSession({
          voiceState: 'speaking',
          phase: 'speaking',
          isListening: true,
          isProcessing: false,
          isSpeaking: true,
        });
        return;
      }
      if (state === 'ready') {
        speakingRef.current = false;
        patchSession({
          voiceState: 'ready',
          phase: 'standby',
          isListening: true,
          isProcessing: false,
          isSpeaking: false,
          currentAction: '',
          debugRealtime: 'connected',
        });
        return;
      }
      if (state === 'disconnected' || state === 'error') {
        speakingRef.current = false;
        if (state === 'disconnected') {
          handsFreeRef.current = false;
          setHandsFree(false);
          voicePathRef.current = 'none';
        }
        patchSession({
          voiceState: state === 'error' ? 'error' : 'disconnected',
          phase: 'dormant',
          isListening: false,
          isProcessing: false,
          isSpeaking: false,
          debugRealtime: state,
        });
      }
    },
    [patchSession]
  );

  const clearSleep = useCallback(() => {
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (voicePathRef.current === 'realtime') {
      realtimeRef.current?.setMicEnabled(false);
      patchSession({ isListening: false });
      return;
    }
    listenerRef.current?.stop();
    patchSession({ isListening: false });
  }, [patchSession]);

  const pauseMic = useCallback(() => {
    if (voicePathRef.current === 'realtime') {
      return;
    }
    if (isMobileVoiceClient()) {
      listenerRef.current?.holdSession();
    } else {
      listenerRef.current?.stop();
    }
    patchSession({ isListening: false });
  }, [patchSession]);

  const startMic = useCallback(
    (mode: 'wake' | 'command', silenceMs?: number) => {
      if (voicePathRef.current === 'realtime') {
        realtimeRef.current?.setMicEnabled(true);
        patchSession({
          voiceState: 'ready',
          phase: 'standby',
          isListening: true,
        });
        return;
      }
      const listener = listenerRef.current;
      if (!listener || !handsFreeRef.current) return;
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
    if (handsFreeRef.current) {
      startMic('wake');
    }
  }, [clearSleep, patchSession, startMic]);

  const armFollowUp = useCallback(
    (ms: number) => {
      followUpRef.current = true;
      clearSleep();
      sleepTimerRef.current = window.setTimeout(() => {
        if (processingRef.current || speakingRef.current) return;
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
      const realtimeOwnsAudio = voicePathRef.current === 'realtime';
      if (realtimeOwnsAudio) {
        speakingRef.current = false;
        if (turnId !== turnIdRef.current) return;
        patchSession({ isSpeaking: false });
        return;
      }
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

      // Realtime owns the microphone. Never let a leftover browser transcript
      // enter /api/chat or the local keyword engine at the same time.
      if (voicePathRef.current === 'realtime' && options.source === 'voice') {
        return;
      }

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
        (options.source === 'voice' && !sessionOpen && listeningMode === 'wake');

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
        debugEngine: '',
        debugToolArgs: '',
      });
      logTransition('AI', `request started: "${trimmed}"`);

      try {
        const spoken = detectSpokenLanguage(
          stripWakeWord(trimmed) || trimmed,
          engineRef.current.getContext().language
        );
        if (spoken.switched) {
          engineRef.current.setLanguage(spoken.language);
          phone.dispatch({
            type: 'SET_LANGUAGE',
            language: spoken.language,
            banner: spoken.label,
          });
        }

        const usedOpenAI = await openAISession.isConfigured();
        if (usedOpenAI) {
          try {
            const result = await withTimeout(
              openAISession.process(stripWakeWord(trimmed) || trimmed, spoken.language, async (actions, toolName) => {
                if (turnId !== turnIdRef.current || cancelledRef.current) return 'cancelled';
                patchSession({
                  debugIntent: toolName,
                  debugEngine: 'openai',
                  voiceState: 'executing_action',
                  phase: 'executing',
                  isProcessing: false,
                });
                logTransition('ACTION', `${toolName} started`);
                return actionEngineRef.current.run(actions, {
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
              }),
              OPENAI_TIMEOUT_MS
            );
            logTransition('AI', `openai response (${result.executedTools.join(',') || 'talk'})`);
            processingRef.current = false;
            patchSession({
              isProcessing: false,
              debugIntent: result.executedTools.join(', ') || 'conversation',
              debugEngine: 'openai',
              debugToolArgs: result.lastToolArgs,
            });
            await speakLine(result.reply, result.language, turnId, result.executedTools.length > 0);
            if (turnId !== turnIdRef.current || cancelledRef.current) return;
            const expectFollowUp =
              result.expectFollowUp || handsFreeRef.current || options.source === 'text';
            followUpRef.current = expectFollowUp;
            processingRef.current = false;
            if (expectFollowUp) {
              armFollowUp(result.executedTools.length ? FOLLOW_UP_MS : TASK_FOLLOW_UP_MS);
            } else {
              await delay(500);
              if (turnId === turnIdRef.current) enterIdle();
            }
            return;
          } catch (openaiError) {
            const message = openaiError instanceof Error ? openaiError.message : '';
            if (!/not configured/i.test(message)) throw openaiError;
            openAISession.markUnavailable();
            logTransition('AI', 'openai unavailable, using FALLBACK local engine');
          }
        }

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
        patchSession({
          isProcessing: false,
          debugEngine: 'local',
        });

        await runTurn(result, turnId);

        if (turnId !== turnIdRef.current || cancelledRef.current) return;

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
        const detail = error instanceof Error ? error.message : '';
        patchSession({
          debugEngine: 'openai',
          debugIntent: 'error',
          debugToolArgs: detail.slice(0, 180),
        });
        recover(
          detail && !/fetch|abort|timeout/i.test(detail)
            ? `I couldn't reach ChatGPT. ${detail}`
            : "I'm having trouble processing that. Please try again."
        );
      }
    },
    [armFollowUp, clearSleep, enterIdle, pauseMic, patchSession, phone, recover, runTurn, speakLine]
  );

  const ingestRef = useRef(ingest);
  ingestRef.current = ingest;
  const enterIdleRef = useRef(enterIdle);
  enterIdleRef.current = enterIdle;
  const patchSessionRef = useRef(patchSession);
  patchSessionRef.current = patchSession;
  const recoverRef = useRef(recover);
  recoverRef.current = recover;
  const ensureFallbackSttRef = useRef<() => BrowserSpeechProvider | null>(() => null);

  useEffect(() => {
    void openAISession.isConfigured();
  }, []);

  useEffect(() => {
    actionEngineRef.current = new ActionEngine(phone.dispatch);
  }, [phone.dispatch]);

  useEffect(() => {
    ensureFallbackSttRef.current = () => {
      if (listenerRef.current) return listenerRef.current;
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
        if (voicePathRef.current === 'realtime') return;
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
        if (voicePathRef.current === 'realtime') return;
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
      return listener;
    };
    return () => {
      listenerRef.current?.stop();
      realtimeRef.current?.disconnect();
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
    };
  }, []);

  const enableHandsFree = useCallback(async () => {
    stopSpeaking();
    processingRef.current = false;
    speakingRef.current = false;
    followUpRef.current = false;
    lastSpokenRef.current = '';
    cancelledRef.current = false;

    if (isRealtimeSupported()) {
      patchSession({
        voiceState: 'connecting',
        phase: 'thinking',
        isProcessing: true,
        debugEngine: 'realtime',
        debugRealtime: 'connecting',
      });
      realtimeRef.current?.disconnect();
      const client = new RealtimeVoiceClient({
        onState: applyRealtimeUi,
        onUserTranscript: (text, final) => {
          lastUtteranceRef.current = text;
          patchSession({ heard: text, phase: final ? 'thinking' : 'listening' });
          if (final) openAISession.recordUser(text);
        },
        onAssistantTranscript: (text, final) => {
          lastSpokenRef.current = text;
          lastSpokenAtRef.current = Date.now();
          patchSession({ reply: text, isSpeaking: true, phase: 'speaking' });
          if (final) openAISession.recordAssistant(text);
        },
        onEvent: (type) => patchSession({ debugLastEvent: type }),
        onError: (message) => {
          logTransition('VOICE', `realtime error: ${message}`);
          patchSession({ debugLastEvent: message, debugRealtime: 'error' });
        },
        onFunctionCalls: async (calls) => {
          const language = languageRef.current;
          client.setExecuting(true);
          patchSession({
            voiceState: 'executing_action',
            phase: 'executing',
            debugEngine: 'realtime',
          });
          for (const call of calls) {
            let parsed: Record<string, unknown> = {};
            try {
              parsed = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
            } catch {
              parsed = {};
            }
            const planned = planToolCall(call.name, parsed, language);
            patchSession({
              debugIntent: planned.name,
              debugToolArgs: JSON.stringify(planned.arguments),
            });
            if (planned.actions.length) {
              const outcome = await executePhoneActionsRef.current(planned.actions, planned.name);
              planned.result.actionState = outcome;
              if (outcome !== 'completed') {
                planned.result.success = false;
                planned.result.error =
                  outcome === 'cancelled'
                    ? 'The user cancelled the action.'
                    : 'The phone simulation failed.';
              }
            }
            client.returnToolResult(call.callId, planned.result);
          }
          client.setExecuting(false);
          client.requestResponse();
        },
      });
      realtimeRef.current = client;
      try {
        await client.connect(languageRef.current);
        voicePathRef.current = 'realtime';
        setMicReady(true);
        setHandsFree(true);
        handsFreeRef.current = true;
        setMicError('');
        playActivationChime();
        client.seedHistory(
          openAISession.getMessages().map((message) => ({
            role: message.role,
            content: message.content,
          }))
        );
        patchSession({
          voiceState: 'ready',
          phase: 'standby',
          isListening: true,
          isProcessing: false,
          debugEngine: 'realtime',
          debugRealtime: 'connected',
        });
        return true;
      } catch (error) {
        logTransition('VOICE', 'realtime unavailable, using browser fallback', error);
        client.disconnect();
        realtimeRef.current = null;
        voicePathRef.current = 'none';
        patchSession({
          debugRealtime: 'fallback',
          debugLastEvent: error instanceof Error ? error.message : 'realtime failed',
        });
      }
    }

    const listener = ensureFallbackSttRef.current();
    if (!listener) return false;
    const granted = await listener.requestMicrophone();
    setMicReady(granted);
    if (!granted) {
      const message =
        'Microphone access is required for voice interaction. You can also type your request.';
      setFallbackOpen(true);
      setMicError(message);
      return false;
    }
    voicePathRef.current = 'browser';
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
      debugEngine: 'local',
      debugRealtime: 'browser-fallback',
    });
    const started = listener.restartFresh('wake', engineRef.current.getContext().language);
    if (!started) {
      setHandsFree(false);
      handsFreeRef.current = false;
      voicePathRef.current = 'none';
      setFallbackOpen(true);
      return false;
    }
    return true;
  }, [applyRealtimeUi, patchSession]);

  useEffect(() => {
    languageRef.current = phone.state.language;
    engineRef.current.setLanguage(phone.state.language);
    listenerRef.current?.setLanguage(phone.state.language);
    if (voicePathRef.current === 'realtime') {
      realtimeRef.current?.updateLanguage(phone.state.language);
    }
  }, [phone.state.language]);

  useEffect(() => {
    voiceRateRef.current = phone.state.voiceRate;
  }, [phone.state.voiceRate]);

  useEffect(() => {
    const stuck =
      phone.state.voiceState === 'connecting' || phone.state.voiceState === 'processing';
    if (!stuck) return;
    const timer = window.setTimeout(() => {
      if (voicePathRef.current === 'realtime') {
        realtimeRef.current?.cancelResponse();
        applyRealtimeUi('ready');
        return;
      }
      recover("That took too long. Please try again.");
    }, 25000);
    return () => window.clearTimeout(timer);
  }, [applyRealtimeUi, phone.state.voiceState, recover]);

  const submitText = useCallback(
    async (text: string) => {
      followUpRef.current = true;
      if (voicePathRef.current === 'realtime' && realtimeRef.current?.isConnected()) {
        const spoken = detectSpokenLanguage(text, languageRef.current);
        if (spoken.switched) {
          languageRef.current = spoken.language;
          engineRef.current.setLanguage(spoken.language);
          phone.dispatch({
            type: 'SET_LANGUAGE',
            language: spoken.language,
            banner: spoken.label,
          });
          realtimeRef.current.updateLanguage(spoken.language);
        }
        lastUtteranceRef.current = text;
        openAISession.recordUser(text);
        patchSession({
          heard: text,
          voiceState: 'processing',
          phase: 'thinking',
          isProcessing: true,
          debugEngine: 'realtime',
        });
        realtimeRef.current.sendUserText(text);
        return;
      }
      await ingest(text, { source: 'text', requireWake: false });
    },
    [ingest, patchSession, phone]
  );

  const retryLast = useCallback(async () => {
    phone.dispatch({ type: 'CLEAR_ERROR' });
    const last = lastUtteranceRef.current;
    if (!last) return;
    processingRef.current = false;
    await submitText(last);
  }, [phone, submitText]);

  const abortAll = useCallback(() => {
    cancelledRef.current = true;
    turnIdRef.current += 1;
    processingRef.current = false;
    speakingRef.current = false;
    stopSpeaking();
    stopMic();
    realtimeRef.current?.cancelResponse();
    if (voicePathRef.current === 'realtime') {
      realtimeRef.current?.setMicEnabled(true);
    }
    engineRef.current.reset();
    openAISession.reset();
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

  const resetDevice = useCallback(() => {
    abortAll();
    engineRef.current.reset();
    phone.dispatch({ type: 'RESET_DEVICE' });
    enterIdle();
  }, [abortAll, enterIdle, phone]);

  return {
    micReady,
    micSupported,
    handsFree,
    fallbackOpen,
    micError,
    setFallbackOpen,
    enableHandsFree,
    submitText,
    retryLast,
    resetDevice,
    abortAll,
    handleUtterance: (text: string) => submitText(text),
  };
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

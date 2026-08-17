'use client';

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { contactsService } from '../lib/services/contacts';
import { messageService } from '../lib/services/messages';
import { walletService } from '../lib/services/wallet';
import type {
  ActiveCall,
  AirtimeDraft,
  AppId,
  AssistantPhase,
  ChatBubble,
  PermissionRequest,
  PhoneAction,
  PhoneScreen,
  TransferDraft,
  VoiceState,
} from '../lib/phone/types';
import type { LanguageCode, WalletSnapshot } from '../lib/types';

export interface PhoneState {
  screen: PhoneScreen;
  history: PhoneScreen[];
  activeContactId: string | null;
  chats: Record<string, ChatBubble[]>;
  draftMessage: { contactId: string; text: string } | null;
  call: ActiveCall | null;
  transfer: TransferDraft | null;
  airtime: AirtimeDraft | null;
  airtimeBalance: number;
  wallet: WalletSnapshot;
  permission: PermissionRequest | null;
  language: LanguageCode;
  languageBanner: string | null;
  assistantPhase: AssistantPhase;
  assistantReply: string;
  assistantHeard: string;
  alarmTime: string | null;
  textScale: number;
  voiceRate: number;
  error: boolean;
  errorMessage: string;
  voiceState: VoiceState;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentAction: string;
  actionState: string;
  activeDemo: string | null;
  debugIntent: string;
  debugEngine: 'openai' | 'local' | 'realtime' | '';
  debugToolArgs: string;
  debugRealtime: string;
  debugLastEvent: string;
}

const initialState = (): PhoneState => ({
  screen: 'home',
  history: [],
  activeContactId: null,
  chats: messageService.all(),
  draftMessage: null,
  call: null,
  transfer: null,
  airtime: null,
  airtimeBalance: 2.4,
  wallet: walletService.snapshot(),
  permission: null,
  language: 'en',
  languageBanner: null,
  assistantPhase: 'dormant',
  assistantReply: '',
  assistantHeard: '',
  alarmTime: null,
  textScale: 1,
  voiceRate: 0.96,
  error: false,
  errorMessage: '',
  voiceState: 'idle',
  isListening: false,
  isProcessing: false,
  isSpeaking: false,
  currentAction: '',
  actionState: 'idle',
  activeDemo: null,
  debugIntent: '',
  debugEngine: '',
  debugToolArgs: '',
  debugRealtime: '',
  debugLastEvent: '',
});

function pushScreen(state: PhoneState, screen: PhoneScreen): PhoneState {
  if (state.screen === screen) return state;
  return {
    ...state,
    history: [...state.history, state.screen],
    screen,
  };
}

function reducer(state: PhoneState, action: PhoneAction | AssistantAction): PhoneState {
  switch (action.type) {
    case 'OPEN_APP':
      return pushScreen({ ...state, permission: null }, action.app);
    case 'GO_HOME':
      return {
        ...state,
        screen: 'home',
        history: [],
        permission: null,
        call: state.screen === 'call' ? null : state.call,
      };
    case 'GO_BACK': {
      if (state.permission) return { ...state, permission: null };
      if (state.history.length === 0) return { ...state, screen: 'home' };
      const history = [...state.history];
      const screen = history.pop() ?? 'home';
      return { ...state, history, screen };
    }
    case 'OPEN_CHAT':
      return pushScreen(
        { ...state, activeContactId: action.contactId },
        action.channel === 'messages' ? 'messages-thread' : 'whatsapp-chat'
      );
    case 'COMPOSE_MESSAGE':
      return {
        ...state,
        activeContactId: action.contactId,
        draftMessage: { contactId: action.contactId, text: action.text },
        chats: messageService.all(),
      };
    case 'SEND_MESSAGE': {
      const incoming = 'text' in action ? action.text : undefined;
      const draft =
        incoming ||
        (state.draftMessage?.contactId === action.contactId ? state.draftMessage.text : '');
      if (!draft) return state;
      const bubble = messageService.compose(action.contactId, draft);
      window.setTimeout(() => {
        messageService.markSent(action.contactId, bubble.id);
        messageService.markDelivered(action.contactId, bubble.id);
      }, 400);
      return {
        ...state,
        draftMessage: null,
        chats: messageService.all(),
        activeContactId: action.contactId,
        screen: 'whatsapp-chat',
      };
    }
    case 'START_CALL':
      return {
        ...state,
        call: { contactId: action.contactId, startedAt: Date.now() },
        screen: 'call',
        history: [...state.history, state.screen],
      };
    case 'END_CALL':
      return {
        ...state,
        call: null,
        screen: 'phone',
      };
    case 'PREPARE_TRANSFER': {
      const contact = contactsService.findById(action.recipientId);
      return {
        ...state,
        screen: 'ecocash-send',
        history: state.screen === 'ecocash-send' ? state.history : [...state.history, state.screen],
        transfer: {
          recipientId: action.recipientId,
          recipientName: contact?.name ?? 'Recipient',
          amount: action.amount,
          service: action.service ?? 'EcoCash',
          phase: 'form',
        },
      };
    }
    case 'SHOW_PERMISSION':
      return { ...state, permission: action.permission };
    case 'CLEAR_PERMISSION':
      return { ...state, permission: null };
    case 'ADVANCE_TRANSFER': {
      if (!state.transfer) return state;
      const screenMap: Record<TransferDraft['phase'], PhoneScreen> = {
        form: 'ecocash-send',
        permission: 'ecocash-send',
        confirm: 'ecocash-confirm',
        auth: 'ecocash-auth',
        processing: 'ecocash-processing',
        success: 'ecocash-success',
      };
      return {
        ...state,
        transfer: { ...state.transfer, phase: action.phase },
        screen: screenMap[action.phase],
        permission: action.phase === 'permission' ? state.permission : null,
      };
    }
    case 'COMPLETE_TRANSFER': {
      if (!state.transfer) return state;
      return {
        ...state,
        transfer: { ...state.transfer, phase: 'success' },
        screen: 'ecocash-success',
        wallet: walletService.snapshot(),
        permission: null,
      };
    }
    case 'PREPARE_AIRTIME':
      return {
        ...state,
        screen: 'airtime',
        airtime: { amount: action.amount, phase: 'form' },
      };
    case 'ADVANCE_AIRTIME': {
      if (!state.airtime) return state;
      const screenMap: Record<AirtimeDraft['phase'], PhoneScreen> = {
        form: 'airtime',
        confirm: 'airtime-confirm',
        processing: 'airtime-processing',
        success: 'airtime-success',
      };
      return {
        ...state,
        airtime: { ...state.airtime, phase: action.phase },
        screen: screenMap[action.phase],
      };
    }
    case 'COMPLETE_AIRTIME':
      return {
        ...state,
        airtime: state.airtime
          ? { ...state.airtime, phase: 'success' }
          : state.airtime,
        screen: 'airtime-success',
        airtimeBalance: state.airtime
          ? Number((state.airtimeBalance + state.airtime.amount).toFixed(2))
          : state.airtimeBalance,
        wallet: walletService.snapshot(),
      };
    case 'SET_ALARM':
      return {
        ...state,
        alarmTime: action.time,
        screen: 'clock',
        history: state.screen === 'clock' ? state.history : [...state.history, state.screen],
      };
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.language,
        languageBanner: action.banner ?? null,
      };
    case 'CLEAR_LANGUAGE_BANNER':
      return { ...state, languageBanner: null };
    case 'SET_TEXT_SCALE':
      return { ...state, textScale: action.scale };
    case 'SET_VOICE_RATE':
      return { ...state, voiceRate: action.rate };
    case 'SET_ERROR':
      return {
        ...state,
        error: true,
        errorMessage: 'message' in action && action.message ? action.message : '',
        assistantPhase: 'dormant',
        voiceState: 'error',
        isListening: false,
        isProcessing: false,
        isSpeaking: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: false, errorMessage: '' };
    case 'SYNC_WALLET':
      return { ...state, wallet: walletService.snapshot() };
    case 'RESET_DEVICE': {
      const language = state.language;
      const textScale = state.textScale;
      const voiceRate = state.voiceRate;
      messageService.reset();
      walletService.reset();
      return { ...initialState(), language, textScale, voiceRate };
    }
    case 'SET_ASSISTANT':
      return {
        ...state,
        assistantPhase: action.phase,
        assistantReply: action.reply ?? state.assistantReply,
        assistantHeard: action.heard ?? state.assistantHeard,
      };
    case 'SET_SESSION':
      return {
        ...state,
        voiceState: action.voiceState ?? state.voiceState,
        assistantPhase: action.phase ?? state.assistantPhase,
        assistantReply: action.reply ?? state.assistantReply,
        assistantHeard: action.heard ?? state.assistantHeard,
        isListening: action.isListening ?? state.isListening,
        isProcessing: action.isProcessing ?? state.isProcessing,
        isSpeaking: action.isSpeaking ?? state.isSpeaking,
        currentAction: action.currentAction ?? state.currentAction,
        actionState: action.actionState ?? state.actionState,
        activeDemo: action.activeDemo === undefined ? state.activeDemo : action.activeDemo,
        debugIntent: action.debugIntent ?? state.debugIntent,
        debugEngine: action.debugEngine ?? state.debugEngine,
        debugToolArgs: action.debugToolArgs ?? state.debugToolArgs,
        debugRealtime: action.debugRealtime ?? state.debugRealtime,
        debugLastEvent: action.debugLastEvent ?? state.debugLastEvent,
      };
    case 'REFRESH_CHATS':
      return { ...state, chats: messageService.all() };
    default:
      return state;
  }
}

export type AssistantAction =
  | {
      type: 'SET_ASSISTANT';
      phase: AssistantPhase;
      reply?: string;
      heard?: string;
    }
  | {
      type: 'SET_SESSION';
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
    }
  | { type: 'REFRESH_CHATS' };

const PhoneContext = createContext<{
  state: PhoneState;
  dispatch: Dispatch<PhoneAction | AssistantAction>;
  openApp: (app: AppId) => void;
  goHome: () => void;
  goBack: () => void;
} | null>(null);

export function PhoneProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const api = useMemo(
    () => ({
      state,
      dispatch,
      openApp: (app: AppId) => dispatch({ type: 'OPEN_APP', app }),
      goHome: () => dispatch({ type: 'GO_HOME' }),
      goBack: () => dispatch({ type: 'GO_BACK' }),
    }),
    [state]
  );

  return <PhoneContext.Provider value={api}>{children}</PhoneContext.Provider>;
}

export function usePhone() {
  const value = useContext(PhoneContext);
  if (!value) {
    throw new Error('usePhone must be used within PhoneProvider');
  }
  return value;
}

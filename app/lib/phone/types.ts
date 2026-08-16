import type { Contact, LanguageCode, PaymentMethod } from '../types';

export type AppId =
  | 'whatsapp'
  | 'messages'
  | 'phone'
  | 'ecocash'
  | 'innbucks'
  | 'airtime'
  | 'clock'
  | 'calculator'
  | 'settings'
  | 'camera'
  | 'maps'
  | 'gallery';

export type PhoneScreen =
  | 'home'
  | AppId
  | 'whatsapp-chat'
  | 'messages-thread'
  | 'call'
  | 'ecocash-send'
  | 'ecocash-confirm'
  | 'ecocash-auth'
  | 'ecocash-processing'
  | 'ecocash-success'
  | 'airtime-confirm'
  | 'airtime-processing'
  | 'airtime-success';

export type VoiceState =
  | 'idle'
  | 'wake_detected'
  | 'listening'
  | 'processing'
  | 'executing_action'
  | 'speaking'
  | 'waiting_for_follow_up'
  | 'error';

export type AssistantPhase =
  | 'dormant'
  | 'waking'
  | 'listening'
  | 'thinking'
  | 'executing'
  | 'speaking'
  | 'minimized'
  | 'standby';

export type PermissionKind =
  | 'microphone'
  | 'contacts'
  | 'messages'
  | 'phone'
  | 'financial'
  | 'notifications';

export type ChatDelivery = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatBubble {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: number;
  status: ChatDelivery;
}

export interface ActiveCall {
  contactId: string;
  startedAt: number;
}

export interface TransferDraft {
  recipientId: string;
  recipientName: string;
  amount: number;
  service: PaymentMethod;
  phase: 'form' | 'permission' | 'confirm' | 'auth' | 'processing' | 'success';
}

export interface AirtimeDraft {
  amount: number;
  phase: 'form' | 'confirm' | 'processing' | 'success';
}

export interface PermissionRequest {
  kind: PermissionKind;
  title: string;
  body: string;
}

export type TaskType =
  | 'send_message'
  | 'send_money'
  | 'buy_airtime'
  | 'make_call'
  | 'open_app'
  | 'check_time'
  | 'check_balance'
  | 'set_reminder';

export type TaskStep =
  | 'collect'
  | 'confirm'
  | 'permission'
  | 'authorize'
  | 'processing'
  | 'complete';

export type TaskLifecycle =
  | 'NEW'
  | 'UNDERSTANDING'
  | 'COLLECTING_INFORMATION'
  | 'READY_FOR_CONFIRMATION'
  | 'CONFIRMATION_RECEIVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface ConversationTask {
  type: TaskType;
  step: TaskStep;
  status?: TaskLifecycle;
  taskId?: string;
  confirmed?: boolean;
  app?: AppId;
  contact?: Contact;
  message?: string;
  amount?: number;
  service?: PaymentMethod;
  when?: string;
}

export interface DialogueContext {
  language: LanguageCode;
  languageBanner: string | null;
  task: ConversationTask | null;
  lastUserText: string;
}

export type PhoneAction =
  | { type: 'OPEN_APP'; app: AppId }
  | { type: 'GO_HOME' }
  | { type: 'GO_BACK' }
  | { type: 'OPEN_CHAT'; contactId: string; channel: 'whatsapp' | 'messages' }
  | { type: 'COMPOSE_MESSAGE'; contactId: string; text: string }
  | { type: 'SEND_MESSAGE'; contactId: string; text?: string }
  | { type: 'START_CALL'; contactId: string }
  | { type: 'END_CALL' }
  | { type: 'PREPARE_TRANSFER'; recipientId: string; amount: number; service?: PaymentMethod }
  | { type: 'SHOW_PERMISSION'; permission: PermissionRequest }
  | { type: 'CLEAR_PERMISSION' }
  | { type: 'ADVANCE_TRANSFER'; phase: TransferDraft['phase'] }
  | { type: 'COMPLETE_TRANSFER' }
  | { type: 'PREPARE_AIRTIME'; amount: number }
  | { type: 'ADVANCE_AIRTIME'; phase: AirtimeDraft['phase'] }
  | { type: 'COMPLETE_AIRTIME' }
  | { type: 'SET_ALARM'; time: string }
  | { type: 'SET_LANGUAGE'; language: LanguageCode; banner?: string | null }
  | { type: 'CLEAR_LANGUAGE_BANNER' }
  | { type: 'SET_TEXT_SCALE'; scale: number }
  | { type: 'SET_VOICE_RATE'; rate: number }
  | { type: 'SET_ERROR'; message?: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SYNC_WALLET' }
  | { type: 'RESET_DEVICE' };

export interface EngineTurn {
  reply: string;
  followUpReply?: string;
  language: LanguageCode;
  languageChanged: boolean;
  languageBanner: string | null;
  expectFollowUp: boolean;
  actions: PhoneAction[];
  task: ConversationTask | null;
  intent?: string;
  asyncReply?: () => Promise<string>;
}

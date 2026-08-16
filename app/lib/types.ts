export type LanguageCode = 'en' | 'sn' | 'nd' | 'sw';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  speechRecognitionCode?: string;
  speechSynthesisCode?: string;
}

export type IntentName =
  | 'send_money'
  | 'check_balance'
  | 'buy_airtime'
  | 'make_call'
  | 'check_time'
  | 'help'
  | 'greeting'
  | 'hypothetical_balance'
  | 'unknown';

export type DialogueAct =
  | 'inform'
  | 'confirm'
  | 'deny'
  | 'cancel'
  | 'correct'
  | 'clarify'
  | 'switch_language';

export type ConversationStep =
  | 'idle'
  | 'awaiting_recipient'
  | 'awaiting_amount'
  | 'awaiting_confirmation'
  | 'awaiting_authentication'
  | 'processing'
  | 'complete';

export type TransactionStatus =
  | 'idle'
  | 'confirming'
  | 'authenticating'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled';

export type PaymentMethod = 'EcoCash' | 'InnBucks';

export type BundleType = 'whatsapp' | 'voice' | 'sms';

export interface Contact {
  id: string;
  name: string;
  aliases: string[];
  phone: string;
  defaultMatch?: boolean;
  unsaved?: boolean;
}

export interface MoneyAmount {
  value: number;
  currency: 'USD';
}

export interface ConversationState {
  language: LanguageCode;
  currentIntent: IntentName | null;
  conversationStep: ConversationStep;
  recipient?: Contact;
  amount?: MoneyAmount;
  paymentMethod: PaymentMethod;
  bundleType?: BundleType;
  requiresConfirmation: boolean;
  transactionStatus: TransactionStatus;
  lastQuotedBalance?: number;
  pendingClarification?: {
    type: 'contact' | 'amount';
    options?: Contact[];
  };
  lastUserText?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language: LanguageCode;
  timestamp: number;
  status?: TransactionStatus;
}

export interface Understanding {
  act: DialogueAct;
  intent?: IntentName;
  entities: {
    amount?: number;
    contactQuery?: string;
    contact?: Contact;
    contactOptions?: Contact[];
    language?: LanguageCode;
    bundleType?: BundleType;
    hypothetical?: boolean;
  };
  confidence: number;
}

export interface WalletSnapshot {
  owner: string;
  balance: number;
  paymentMethods: PaymentMethod[];
  lastTransaction?: SimulatedTransaction;
}

export interface SimulatedTransaction {
  id: string;
  type: 'send_money' | 'buy_airtime';
  amount: number;
  recipientName?: string;
  status: TransactionStatus;
  timestamp: number;
}

export type VoiceStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

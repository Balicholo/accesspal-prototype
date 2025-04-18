export interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: number;
  language?: Language;
  status?: 'pending' | 'success' | 'error';
  action?: {
    type: 'send_money' | 'check_balance' | 'buy_airtime' | 'make_call';
    data?: Record<string, any>;
  };
}

export interface Intent {
  command: string;
  keywords: {
    en: string[];
    sn: string[];
  };
  response: {
    en: string | (() => string);
    sn: string | (() => string);
  };
}

export type Language = 'en' | 'sn';

export interface Transaction {
  type: 'send_money' | 'check_balance' | 'buy_airtime';
  amount?: number;
  recipient?: string;
  status: 'pending' | 'success' | 'error';
  timestamp: number;
}
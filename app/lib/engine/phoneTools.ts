/**
 * Single tool → PhoneAction router for both Realtime voice and /api/chat text.
 * Natural language understanding belongs in OpenAI, not here.
 */
import { APP_DISPLAY_NAMES } from '../ai/tools';
import { createPermission } from '../services/permissions';
import { contactsService } from '../services/contacts';
import { getCurrentTime } from '../services/time';
import { walletService } from '../services/wallet';
import { createId } from '../format';
import type { AppId, PhoneAction } from '../phone/types';
import type { LanguageCode, PaymentMethod } from '../types';

const APPS = new Set<AppId>(Object.keys(APP_DISPLAY_NAMES) as AppId[]);

export interface ToolExecution {
  name: string;
  arguments: Record<string, unknown>;
  actions: PhoneAction[];
  result: Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asApp(value: unknown): AppId | undefined {
  const id = asString(value).toLowerCase() as AppId;
  return APPS.has(id) ? id : undefined;
}

function asProvider(value: unknown): PaymentMethod {
  const raw = asString(value).toLowerCase();
  if (raw.includes('inn')) return 'InnBucks';
  return 'EcoCash';
}

export function planToolCall(
  name: string,
  rawArgs: Record<string, unknown>,
  language: LanguageCode
): ToolExecution {
  try {
    return planToolCallUnsafe(name, rawArgs, language);
  } catch (error) {
    return {
      name,
      arguments: rawArgs,
      actions: [],
      result: {
        success: false,
        simulated: true,
        error: error instanceof Error ? error.message : 'Tool failed',
      },
    };
  }
}

function planToolCallUnsafe(
  name: string,
  args: Record<string, unknown>,
  language: LanguageCode
): ToolExecution {
  switch (name) {
    case 'open_app': {
      const app = asApp(args.app);
      if (!app) {
        return fail(name, args, 'Unknown app.');
      }
      return ok(name, args, [{ type: 'OPEN_APP', app }], {
        app,
        label: APP_DISPLAY_NAMES[app],
      });
    }
    case 'send_message': {
      const recipient = asString(args.recipient);
      const message = asString(args.message);
      const channel = asString(args.channel) === 'messages' ? 'messages' : 'whatsapp';
      if (!recipient || !message) {
        return fail(name, args, 'Recipient and message are required.');
      }
      const contact = contactsService.remember(recipient);
      const app: AppId = channel === 'messages' ? 'messages' : 'whatsapp';
      return ok(
        name,
        args,
        [
          { type: 'OPEN_APP', app },
          { type: 'OPEN_CHAT', contactId: contact.id, channel },
          { type: 'COMPOSE_MESSAGE', contactId: contact.id, text: message },
          { type: 'SEND_MESSAGE', contactId: contact.id, text: message },
        ],
        { recipient: contact.name, message, channel, simulated: true }
      );
    }
    case 'make_call': {
      const contactName = asString(args.contact) || asString(args.recipient);
      if (!contactName) return fail(name, args, 'A contact name is required.');
      const contact = contactsService.remember(contactName);
      return ok(
        name,
        args,
        [
          { type: 'OPEN_APP', app: 'phone' },
          { type: 'START_CALL', contactId: contact.id },
        ],
        { contact: contact.name, simulated: true }
      );
    }
    case 'send_money': {
      const recipient = asString(args.recipient);
      const amount = asNumber(args.amount);
      const provider = asProvider(args.provider);
      if (!recipient || amount === undefined) {
        return fail(name, args, 'Recipient and amount are required.');
      }
      if (!walletService.canAfford(amount)) {
        return fail(name, args, `Insufficient simulated balance. Balance is $${walletService.getBalance()}.`);
      }
      const contact = contactsService.remember(recipient);
      return ok(
        name,
        args,
        [
          { type: 'OPEN_APP', app: provider === 'InnBucks' ? 'innbucks' : 'ecocash' },
          {
            type: 'PREPARE_TRANSFER',
            recipientId: contact.id,
            amount,
            service: provider,
          },
          { type: 'ADVANCE_TRANSFER', phase: 'permission' },
          {
            type: 'SHOW_PERMISSION',
            permission: createPermission('financial', language),
          },
          { type: 'CLEAR_PERMISSION' },
          { type: 'ADVANCE_TRANSFER', phase: 'confirm' },
          { type: 'ADVANCE_TRANSFER', phase: 'auth' },
          { type: 'ADVANCE_TRANSFER', phase: 'processing' },
          { type: 'COMPLETE_TRANSFER' },
        ],
        {
          recipient: contact.name,
          amount,
          currency: asString(args.currency) || 'USD',
          provider,
          simulated: true,
          demoLabel: 'DEMO TRANSACTION',
        }
      );
    }
    case 'buy_airtime': {
      const amount = asNumber(args.amount);
      if (amount === undefined) return fail(name, args, 'Amount is required.');
      if (!walletService.canAfford(amount)) {
        return fail(name, args, `Insufficient simulated balance. Balance is $${walletService.getBalance()}.`);
      }
      return ok(
        name,
        args,
        [
          { type: 'OPEN_APP', app: 'airtime' },
          { type: 'PREPARE_AIRTIME', amount },
          { type: 'ADVANCE_AIRTIME', phase: 'processing' },
          { type: 'COMPLETE_AIRTIME' },
        ],
        {
          amount,
          recipient: asString(args.recipient) || 'this phone',
          provider: asString(args.provider) || 'EcoCash',
          simulated: true,
          demoLabel: 'DEMO TRANSACTION',
        }
      );
    }
    case 'check_balance': {
      const balance = walletService.getBalance();
      return ok(
        name,
        args,
        [
          { type: 'OPEN_APP', app: 'ecocash' },
          { type: 'SYNC_WALLET' },
        ],
        { balance, currency: 'USD', simulated: true }
      );
    }
    case 'get_time': {
      const time = getCurrentTime();
      return ok(name, args, [{ type: 'OPEN_APP', app: 'clock' }], { time });
    }
    case 'set_alarm': {
      const time = asString(args.time);
      if (!time) return fail(name, args, 'A time is required.');
      return ok(
        name,
        args,
        [
          { type: 'SET_ALARM', time },
          { type: 'OPEN_APP', app: 'clock' },
        ],
        { time, simulated: true }
      );
    }
    case 'close_app':
      return ok(name, args, [{ type: 'GO_BACK' }], { closed: true });
    case 'navigate_home':
      return ok(name, args, [{ type: 'GO_HOME' }], { home: true });
    case 'cancel_action':
      return ok(
        name,
        args,
        [
          { type: 'CLEAR_PERMISSION' },
          { type: 'END_CALL' },
          { type: 'GO_HOME' },
        ],
        { cancelled: true }
      );
    default:
      return fail(name, args, `Unknown tool ${name}.`);
  }
}

function ok(
  name: string,
  args: Record<string, unknown>,
  actions: PhoneAction[],
  extra: Record<string, unknown>
): ToolExecution {
  return {
    name,
    arguments: args,
    actions,
    result: {
      success: true,
      simulated: true,
      transactionId: extra.amount ? createId('DEMO') : undefined,
      ...extra,
    },
  };
}

function fail(
  name: string,
  args: Record<string, unknown>,
  error: string
): ToolExecution {
  return {
    name,
    arguments: args,
    actions: [],
    result: { success: false, simulated: true, error },
  };
}

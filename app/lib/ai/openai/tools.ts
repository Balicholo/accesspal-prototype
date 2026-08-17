import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/** Single AccessPal tool catalog. Realtime maps these via toRealtimeTools(). */

export const ACCESSPAL_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'open_app',
      description: 'Open a simulated phone app. Use for requests like open WhatsApp or show EcoCash.',
      parameters: {
        type: 'object',
        properties: {
          app: {
            type: 'string',
            enum: [
              'whatsapp',
              'phone',
              'messages',
              'ecocash',
              'innbucks',
              'airtime',
              'clock',
              'calculator',
              'settings',
              'camera',
              'maps',
              'gallery',
            ],
          },
        },
        required: ['app'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_message',
      description:
        'Send a WhatsApp (or SMS) message on the simulated phone. Only call when both recipient and message text are known. Do not claim the message was sent until this tool returns success.',
      parameters: {
        type: 'object',
        properties: {
          recipient: { type: 'string', description: 'Person to message, as named by the user.' },
          message: { type: 'string', description: 'Exact message body to send.' },
          channel: { type: 'string', enum: ['whatsapp', 'messages'] },
        },
        required: ['recipient', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'make_call',
      description: 'Place a simulated phone call. Only call when the contact name is known.',
      parameters: {
        type: 'object',
        properties: {
          contact: { type: 'string', description: 'Person to call, as named by the user.' },
        },
        required: ['contact'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_money',
      description:
        'Send simulated money via EcoCash or InnBucks. Call only after the user has confirmed amount, recipient, and provider. Never invent a successful transfer.',
      parameters: {
        type: 'object',
        properties: {
          recipient: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string', description: 'Usually USD.' },
          provider: { type: 'string', enum: ['EcoCash', 'InnBucks'] },
        },
        required: ['recipient', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buy_airtime',
      description:
        'Buy simulated airtime. Call only after the user confirms the amount. Never invent a successful purchase.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          recipient: {
            type: 'string',
            description: 'Optional. Defaults to this phone / the user.',
          },
          provider: { type: 'string' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_balance',
      description: 'Read the simulated wallet balance and show EcoCash.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_time',
      description: 'Get the current local time and open the Clock app.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_alarm',
      description: 'Set a simulated alarm on the Clock app.',
      parameters: {
        type: 'object',
        properties: {
          time: { type: 'string', description: 'Human-readable time such as 6:00 AM.' },
        },
        required: ['time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_app',
      description: 'Leave the current app (back or home).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_home',
      description: 'Return to the phone home screen.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_action',
      description: 'Cancel the current phone action, permission sheet, or in-progress call.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

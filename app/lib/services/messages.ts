import { createId } from '../format';
import type { ChatBubble } from '../phone/types';

const minutesAgo = (minutes: number) => Date.now() - minutes * 60_000;

function them(text: string, minutes: number): ChatBubble {
  return {
    id: createId('msg'),
    from: 'them',
    text,
    time: minutesAgo(minutes),
    status: 'read',
  };
}

function me(text: string, minutes: number): ChatBubble {
  return {
    id: createId('msg'),
    from: 'me',
    text,
    time: minutesAgo(minutes),
    status: 'read',
  };
}

/** Simulated messaging store. No real WhatsApp or SMS API is used. */
export class MessageService {
  private chats: Record<string, ChatBubble[]> = {
    joe: [
      them('Are you still coming through later?', 140),
      me('Yes, I am on the way.', 90),
    ],
    'tendai-moyo': [
      them('Bro, send when you can.', 400),
      me('I will do it this afternoon.', 320),
    ],
    mother: [
      them('Call me when you arrive.', 80),
    ],
    'tariro-chikore': [
      them('Did you get the airtime?', 1800),
    ],
    'brian-ncube': [
      me('I will call you after work.', 2400),
    ],
  };

  list(contactId: string): ChatBubble[] {
    return [...(this.chats[contactId] ?? [])];
  }

  all(): Record<string, ChatBubble[]> {
    return Object.fromEntries(
      Object.entries(this.chats).map(([id, messages]) => [id, [...messages]])
    );
  }

  compose(contactId: string, text: string): ChatBubble {
    const bubble: ChatBubble = {
      id: createId('msg'),
      from: 'me',
      text,
      time: Date.now(),
      status: 'sending',
    };
    this.chats[contactId] = [...this.list(contactId), bubble];
    return bubble;
  }

  markSent(contactId: string, messageId: string) {
    this.chats[contactId] = this.list(contactId).map((message) =>
      message.id === messageId
        ? { ...message, status: 'sent' as const }
        : message
    );
  }

  markDelivered(contactId: string, messageId: string) {
    this.chats[contactId] = this.list(contactId).map((message) =>
      message.id === messageId
        ? { ...message, status: 'delivered' as const }
        : message
    );
  }

  reset() {
    this.chats = {
      joe: [
        them('Are you still coming through later?', 140),
        me('Yes, I am on the way.', 90),
      ],
      'tendai-moyo': [
        them('Bro, send when you can.', 400),
        me('I will do it this afternoon.', 320),
      ],
      mother: [them('Call me when you arrive.', 80)],
      'tariro-chikore': [them('Did you get the airtime?', 1800)],
      'brian-ncube': [me('I will call you after work.', 2400)],
    };
  }
}

export const messageService = new MessageService();

'use client';

import { ArrowLeft, Camera, MoreVertical, Phone, Send, Smile, Video } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { contactsService } from '../../lib/services/contacts';
import type { ChatBubble } from '../../lib/phone/types';

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WhatsAppList({
  chats,
  onOpen,
  onBack,
}: {
  chats: Record<string, ChatBubble[]>;
  onOpen: (contactId: string) => void;
  onBack: () => void;
}) {
  const t = useT();
  const rows = contactsService.list().map((contact) => {
    const messages = chats[contact.id] ?? [];
    const last = messages[messages.length - 1];
    return { contact, last };
  });

  return (
    <div className="flex h-full flex-col bg-[#0b141a] text-white">
      <header className="flex items-center justify-between px-4 pb-3 pt-12">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label={t('common.back')}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-lg font-semibold">{t('whatsapp.chats')}</p>
            <p className="text-[11px] text-white/50">WhatsApp</p>
          </div>
        </div>
        <Camera className="h-5 w-5 text-white/70" />
      </header>
      <div className="flex-1 overflow-y-auto">
        {rows.map(({ contact, last }) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onOpen(contact.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00a884] text-sm font-semibold">
              {initials(contact.name)}
            </span>
            <span className="min-w-0 flex-1 border-b border-white/5 pb-3">
              <span className="flex items-center justify-between">
                <span className="font-medium">{contact.name}</span>
                <span className="text-[11px] text-white/40">
                  {last ? formatTime(last.time) : ''}
                </span>
              </span>
              <span className="block truncate text-sm text-white/50">
                {last?.text ?? t('whatsapp.empty')}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function WhatsAppChat({
  contactId,
  messages,
  draft,
  onBack,
}: {
  contactId: string;
  messages: ChatBubble[];
  draft: string;
  onBack: () => void;
}) {
  const t = useT();
  const contact = contactsService.findById(contactId);

  return (
    <div className="flex h-full flex-col bg-[#0b141a] text-white">
      <header className="flex items-center gap-3 bg-[#1f2c34] px-3 pb-3 pt-12">
        <button type="button" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-xs font-semibold">
          {initials(contact?.name ?? 'C')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{contact?.name ?? 'Chat'}</p>
          <p className="text-[11px] text-white/50">{t('whatsapp.contactInfo')}</p>
        </div>
        <Video className="h-5 w-5 text-[#00a884]" />
        <Phone className="h-5 w-5 text-[#00a884]" />
        <MoreVertical className="h-5 w-5 text-white/70" />
      </header>

      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(11,20,26,0.92), rgba(17,27,33,0.96))',
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow ${
                message.from === 'me'
                  ? 'rounded-br-sm bg-[#005c4b]'
                  : 'rounded-bl-sm bg-[#1f2c34]'
              }`}
            >
              <p>{message.text}</p>
              <p className="mt-1 text-right text-[10px] text-white/45">
                {formatTime(message.time)}
                {message.from === 'me' ? ` · ${message.status}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 pb-7 pt-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#1f2c34] px-3 py-2">
          <Smile className="h-5 w-5 text-white/40" />
          <p className={`flex-1 text-sm ${draft ? 'text-white' : 'text-white/35'}`}>
            {draft || t('whatsapp.message')}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884]">
          <Send className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
